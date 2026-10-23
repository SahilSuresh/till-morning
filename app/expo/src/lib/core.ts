import { Platform } from 'react-native';
import * as DA from 'react-native-device-activity';

import { track } from './analytics';
import { cancelPassEnd, scheduleParkedReady, schedulePassEnd } from './notify';
import { dayKey, getState, type ParkedWant, type PriceBand, setState, type ShoppingPass } from './store';
import { award } from './xp';

// The core loop on top of Apple's Screen Time APIs:
//   shield (iOS draws it, our extensions handle the taps)
//   → pause (this app) → leave / park / Shopping Pass
//   → pass: the app is whitelisted for N minutes, a DeviceActivity schedule re-locks it
//     even when Till Morning is closed, and the app re-checks on every launch as a backup.
//
// Shared keys written by the Swift extensions (targets/ShieldAction, targets/ShieldConfiguration):
//   tm_last_shielded (selection), tm_last_shielded_key/_name/_at, tm_shield_log, tm_cooloff::<key>

export const PROTECTED_ID = 'tm_protected';
const LAST_SHIELDED_ID = 'tm_last_shielded';
const PASS_APP_ID = 'tm_pass_app';
const PASS_ACTIVITY = 'tm_pass';

const ios = Platform.OS === 'ios';
const rgb = (hex: string) => ({
  red: parseInt(hex.slice(1, 3), 16),
  green: parseInt(hex.slice(3, 5), 16),
  blue: parseInt(hex.slice(5, 7), 16),
});

// ---- Shield --------------------------------------------------------------

export function shieldSubtitle() {
  const s = getState();
  const line1 = s.goal.trim() ? `You’re saving for ${s.goal.trim()}.` : 'Is this a planned purchase?';
  const waiting = s.parked.filter((w) => !w.decided).length;
  const line2 =
    waiting === 1
      ? '1 thing is already in your waiting room.'
      : waiting > 1
        ? `${waiting} things are already in your waiting room.`
        : '';
  return line2 ? `${line1}\n${line2}` : line1;
}

/** Writes the shield's look and the settings the extensions read. Safe to call often. */
export function applyShieldLook() {
  if (!ios) return;
  DA.updateShield(
    {
      title: 'Hold on. Think twice.',
      subtitle: shieldSubtitle(),
      primaryButtonLabel: 'Close {applicationOrDomainDisplayName}',
      secondaryButtonLabel: 'I still want to shop',
      iconSystemName: 'hourglass',
      iconTint: rgb('#93A5FF'),
      backgroundColor: rgb('#101236'),
      titleColor: rgb('#F3F2FF'),
      subtitleColor: rgb('#B4B6E4'),
      primaryButtonBackgroundColor: rgb('#4361FF'),
      primaryButtonLabelColor: rgb('#FFFFFF'),
      secondaryButtonLabelColor: rgb('#93A5FF'),
    },
    // Taps are handled in targets/ShieldAction; these are only the fallback behaviour.
    { primary: { behavior: 'close' }, secondary: { behavior: 'close' } },
  );
  DA.userDefaultsSet('tm_cooloff_minutes', getState().settings.coolOffMinutes);
}

export function protectedCount() {
  if (!ios) return { apps: 0, categories: 0 };
  try {
    const m = DA.activitySelectionMetadata({ activitySelectionId: PROTECTED_ID });
    return { apps: m?.applicationCount ?? 0, categories: m?.categoryCount ?? 0 };
  } catch {
    return { apps: 0, categories: 0 };
  }
}

/** (Re)applies the shield to the chosen apps. Call after the picker and when shields go back on. */
export function shieldChosenApps() {
  if (!ios) return;
  applyShieldLook();
  DA.resetBlocks();
  DA.blockSelection({ activitySelectionId: PROTECTED_ID });
  // A pass that's still running keeps its app open.
  if (getState().pass) DA.addSelectionToWhitelistAndUpdateBlock({ activitySelectionId: PASS_APP_ID });
  setState({ shieldsOn: true });
}

export function liftAllShields() {
  if (!ios) return;
  DA.resetBlocks();
  DA.clearWhitelist();
  DA.stopMonitoring([PASS_ACTIVITY]);
  setState({ shieldsOn: false });
}

// ---- The app the person was trying to open --------------------------------

export function lastShielded() {
  if (!ios) return null;
  const name = DA.userDefaultsGet<string>('tm_last_shielded_name');
  const at = DA.userDefaultsGet<number>('tm_last_shielded_at') ?? 0;
  const key = DA.userDefaultsGet<string>('tm_last_shielded_key');
  if (!name) return null;
  return { name, at, key };
}

/** The app for a pause opened from the shield in the last few minutes, or null. */
export function recentShieldedApp(withinMs = 10 * 60 * 1000) {
  const last = lastShielded();
  return last && Date.now() - last.at < withinMs ? last : null;
}

// ---- Cool-off ------------------------------------------------------------

export function startCoolOff(app: string, key?: string | null) {
  const minutes = getState().settings.coolOffMinutes;
  if (minutes <= 0) return;
  const until = Date.now() + minutes * 60 * 1000;
  if (ios && key) DA.userDefaultsSet(`tm_cooloff::${key}`, until / 1000);
  setState((s) => ({ coolOffs: { ...s.coolOffs, [app]: until } }));
}

// ---- Shield taps logged by the extension ---------------------------------

type ShieldLogEntry = { a: 'close' | 'want'; n: string; t: number };

/** Turns shield taps (logged while Till Morning was closed) into XP and cool-offs. */
export function processShieldLog() {
  if (!ios) return [] as string[];
  const raw = DA.userDefaultsGet<string>('tm_shield_log');
  if (!raw) return [];
  let entries: ShieldLogEntry[] = [];
  try {
    entries = JSON.parse(raw);
  } catch {
    return [];
  }
  const since = getState().lastShieldLogAt;
  const fresh = entries.filter((e) => e.t > since);
  if (!fresh.length) return [];

  const toasts: string[] = [];
  const minutes = getState().settings.coolOffMinutes;
  for (const e of fresh) {
    if (e.a !== 'close') continue;
    const r = award(2, `Closed ${e.n} at the shield`, { app: e.n, gap: true, isClose: true, at: e.t });
    if (r.ok) toasts.push(`+2 XP · You closed ${e.n}`);
    if (minutes > 0) {
      setState((s) => ({ coolOffs: { ...s.coolOffs, [e.n]: Math.max(s.coolOffs[e.n] ?? 0, e.t + minutes * 60000) } }));
    }
  }
  setState({ lastShieldLogAt: Math.max(...fresh.map((e) => e.t)) });
  return toasts;
}

// ---- Shopping Pass -------------------------------------------------------

export function passesToday() {
  return getState().passesByDay[dayKey()] ?? 0;
}

function components(at: number) {
  const d = new Date(at);
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
    hour: d.getHours(),
    minute: d.getMinutes(),
    second: d.getSeconds(),
  };
}

export async function startPass(draft: Omit<ShoppingPass, 'id' | 'startedAt' | 'endsAt' | 'wholeSelection'>) {
  const now = Date.now();
  const recent = recentShieldedApp();
  const wholeSelection = !(recent && recent.name === draft.app);
  const pass: ShoppingPass = {
    ...draft,
    id: String(now),
    wholeSelection,
    startedAt: now,
    endsAt: now + draft.minutes * 60 * 1000,
  };

  if (ios) {
    // Copy the app (or every protected app, when started from Home) into the pass selection.
    const source = wholeSelection ? PROTECTED_ID : LAST_SHIELDED_ID;
    DA.union({ activitySelectionId: source }, { activitySelectionId: source }, { persistAsActivitySelectionId: PASS_APP_ID, stripToken: true });
    DA.addSelectionToWhitelistAndUpdateBlock({ activitySelectionId: PASS_APP_ID });

    // Re-lock even if Till Morning is closed. Screen Time schedules must be at least
    // 15 minutes long, so the interval starts in the past and ends when the pass does.
    DA.stopMonitoring([PASS_ACTIVITY]);
    DA.configureActions({
      activityName: PASS_ACTIVITY,
      callbackName: 'intervalDidEnd',
      actions: [{ type: 'removeSelectionFromWhitelist', familyActivitySelection: { activitySelectionId: PASS_APP_ID } }],
    });
    const start = Math.min(now, pass.endsAt - 15 * 60 * 1000 - 5000);
    await DA.startMonitoring(
      PASS_ACTIVITY,
      { intervalStart: components(start), intervalEnd: components(pass.endsAt), repeats: false },
      [],
    );
  }

  setState((s) => ({
    pass,
    passesByDay: { ...s.passesByDay, [dayKey(now)]: (s.passesByDay[dayKey(now)] ?? 0) + 1 },
  }));
  schedulePassEnd(pass).catch(() => {});
  track('shopping_pass_started', { minutes: pass.minutes });
  return pass;
}

/** Ends the pass: re-shields the app and queues the check-in. Safe to call twice. */
export function endPass(early = false) {
  const { pass } = getState();
  if (!pass) return;
  if (ios) {
    DA.removeSelectionFromWhitelistAndUpdateBlock({ activitySelectionId: PASS_APP_ID });
    DA.stopMonitoring([PASS_ACTIVITY]);
  }
  if (early) cancelPassEnd(pass);
  setState({ pass: null, pendingCheckIn: pass });
}

/** Called on launch, on resume and every second while the app is open. */
export function tick() {
  const s = getState();
  if (s.pass && Date.now() >= s.pass.endsAt) endPass();
}

// ---- Park it till morning ------------------------------------------------

export const BAND_LABEL: Record<PriceBand, string> = {
  unsure: 'Not sure',
  under20: 'Under £20',
  '20to50': '£20 to £50',
  '50to100': '£50 to £100',
  over100: 'Over £100',
};
const BAND_HOURS: Record<Exclude<PriceBand, 'unsure'>, number> = { under20: 1, '20to50': 3, '50to100': 8, over100: 12 };

function next8am(from: number) {
  const d = new Date(from);
  d.setHours(8, 0, 0, 0);
  if (d.getTime() <= from) d.setDate(d.getDate() + 1);
  return d.getTime();
}

/** waitFor() from the prototype: how long a parked want waits before you decide. */
export function waitFor(band: PriceBand, from = Date.now()) {
  const chips: string[] = [];
  let readyAt: number;
  if (band === 'unsure') {
    readyAt = next8am(from);
    chips.push('Not sure? It waits till 08:00');
  } else {
    const h = BAND_HOURS[band];
    readyAt = from + h * 3600 * 1000;
    chips.push(`${BAND_LABEL[band]}: ${h} h`);
  }
  const hour = new Date(readyAt).getHours();
  if (band !== 'unsure' && (hour >= 22 || hour < 8)) {
    // Never ready at night: 22:00–08:00 moves to the next 08:00.
    readyAt = next8am(readyAt);
    chips.push('Ready at night? 08:00');
  }
  return { readyAt, chips };
}

export function formatReady(readyAt: number, now = Date.now()) {
  const d = new Date(readyAt);
  const hhmm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  const today = new Date(now);
  const tomorrow = new Date(now + 86400000);
  if (d.toDateString() === today.toDateString()) return `${hhmm} today`;
  if (d.toDateString() === tomorrow.toDateString()) return `${hhmm} tomorrow`;
  return `${hhmm} ${d.toLocaleDateString('en-GB', { weekday: 'long' })}`;
}

export function formatDuration(ms: number) {
  const mins = Math.max(1, Math.round(ms / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function parkWant(app: string, what: string, band: PriceBand, key?: string | null) {
  const now = Date.now();
  const { readyAt } = waitFor(band, now);
  const want: ParkedWant = { id: String(now), app, what: what.trim(), band, parkedAt: now, readyAt };
  setState((s) => ({ parked: [...s.parked, want] }));
  startCoolOff(app, key);
  scheduleParkedReady(want).catch(() => {});
  applyShieldLook(); // the shield mentions the waiting room
  return want;
}

export function decideWant(id: string, decision: 'let_go' | 'kept') {
  setState((s) => ({
    parked: s.parked.map((w) => (w.id === id ? { ...w, decided: decision, decidedAt: Date.now() } : w)),
  }));
  applyShieldLook();
}

export function readyWants(now = Date.now()) {
  return getState().parked.filter((w) => !w.decided && w.readyAt <= now);
}

export function logPause(app: string, outcome: 'left' | 'parked' | 'shop' | 'walked') {
  setState((s) => ({ pauseLog: [...s.pauseLog, { at: Date.now(), app, outcome }].slice(-200) }));
}
