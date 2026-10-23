import { Platform } from 'react-native';
import * as DA from 'react-native-device-activity';

import { track } from './analytics';
import { cancelPassEnd, scheduleParkedReady, schedulePassEnd } from './notify';
import { breakDay, bump, FREE_PASSES } from './progress';
import { activeChallenge, inSchedule, isTreatNight, saleOn } from './rules';
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

/** Shield subtitle. Line 1: your own message → challenge line → your goal → the habit line. */
export function shieldSubtitle() {
  const s = getState();
  const ch = activeChallenge();
  const line1 = s.settings.shieldMsg.trim()
    ? s.settings.shieldMsg.trim()
    : ch
      ? ch.line(ch.day)
      : s.goal.trim()
        ? `You’re saving for ${s.goal.trim()}.`
        : 'Is this a planned purchase?';
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
  // Read by the shield extension, which draws the night-lock and late-night shields itself.
  const st = getState().settings;
  DA.userDefaultsSet('tm_cooloff_minutes', st.coolOffMinutes);
  DA.userDefaultsSet('tm_nl_on', st.nlOn);
  DA.userDefaultsSet('tm_nl_from', st.nlFrom);
  DA.userDefaultsSet('tm_nl_to', st.nlTo);
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

// ---- One place that decides what is shielded ------------------------------
//
// Inputs: Shield my apps, "Turn off till tomorrow", When to shield, treat nights and a running pass.
// Background DeviceActivity schedules repeat the same decisions while Till Morning is closed.

const SCHED = ['tm_sched', 'tm_sched_sat', 'tm_sched_sun'];
const TREATS = [0, 1, 2, 3, 4, 5, 6].map((d) => `tm_treat_${d}`);
const OFFTILL = 'tm_offtill';
export const TAKEAWAYS_ID = 'tm_takeaways';

// Calendar weekday for DateComponents: Sunday = 1 … Saturday = 7. Ours: Monday = 0.
const calWeekday = (d: number) => ((d + 1) % 7) + 1;

async function monitor(name: string, start: Record<string, number>, end: Record<string, number>, repeats: boolean) {
  try {
    await DA.startMonitoring(name, { intervalStart: start, intervalEnd: end, repeats }, []);
  } catch {
    // A schedule iOS refuses shouldn't stop the rest from working; the app re-checks on launch.
  }
}

/** Puts blocks, whitelists and background schedules in line with the settings. Safe to call often. */
export async function syncShields() {
  if (!ios) return;
  const s = getState();
  const now = Date.now();
  applyShieldLook();
  DA.stopMonitoring([...SCHED, ...TREATS, OFFTILL]);
  DA.resetBlocks();
  DA.clearWhitelist();
  if (!s.shieldsOn || !s.onboarded) return;

  if (s.offUntil > now) {
    // Back on by itself at 07:00, even if Till Morning stays closed.
    DA.configureActions({
      activityName: OFFTILL,
      callbackName: 'intervalDidEnd',
      actions: [{ type: 'blockSelection', familyActivitySelectionId: PROTECTED_ID }],
    });
    await monitor(OFFTILL, components(Math.min(now, s.offUntil - 15 * 60000 - 5000)), components(s.offUntil), false);
    return;
  }

  if (inSchedule(now)) DA.blockSelection({ activitySelectionId: PROTECTED_ID });
  if (s.pass) DA.addSelectionToWhitelistAndUpdateBlock({ activitySelectionId: PASS_APP_ID });
  if (s.takeawaysChosen && isTreatNight(now)) DA.addSelectionToWhitelistAndUpdateBlock({ activitySelectionId: TAKEAWAYS_ID });

  // When to shield: evenings 18:00–06:00, or Saturday and Sunday.
  const block = [{ type: 'blockSelection' as const, familyActivitySelectionId: PROTECTED_ID }];
  const unblock = [{ type: 'unblockSelection' as const, familyActivitySelectionId: PROTECTED_ID }];
  const windows: [string, Record<string, number>, Record<string, number>][] =
    s.settings.schedule === 'evenings'
      ? [['tm_sched', { hour: 18, minute: 0 }, { hour: 5, minute: 59 }]]
      : s.settings.schedule === 'weekends'
        ? [
            ['tm_sched_sat', { weekday: 7, hour: 0, minute: 0 }, { weekday: 7, hour: 23, minute: 59 }],
            ['tm_sched_sun', { weekday: 1, hour: 0, minute: 0 }, { weekday: 1, hour: 23, minute: 59 }],
          ]
        : [];
  for (const [name, start, end] of windows) {
    DA.configureActions({ activityName: name, callbackName: 'intervalDidStart', actions: block });
    DA.configureActions({ activityName: name, callbackName: 'intervalDidEnd', actions: unblock });
    await monitor(name, start, end, true);
  }

  // Treat nights: the takeaway apps open with no pause on the chosen days.
  if (s.takeawaysChosen) {
    const sel = { activitySelectionId: TAKEAWAYS_ID };
    for (const d of s.settings.treats) {
      const name = `tm_treat_${d}`;
      DA.configureActions({ activityName: name, callbackName: 'intervalDidStart', actions: [{ type: 'addSelectionToWhitelist', familyActivitySelection: sel }] });
      DA.configureActions({ activityName: name, callbackName: 'intervalDidEnd', actions: [{ type: 'removeSelectionFromWhitelist', familyActivitySelection: sel }] });
      await monitor(name, { weekday: calWeekday(d), hour: 0, minute: 0 }, { weekday: calWeekday(d), hour: 23, minute: 59 }, true);
    }
  }
}

/** Shields on (from the switch, Today or setup). +5 XP once a day when they come back on. */
export function shieldChosenApps() {
  const wasOff = !getState().shieldsOn || getState().offUntil > Date.now();
  setState({ shieldsOn: true, offUntil: 0 });
  syncShields();
  // v24: +5 XP once a day for turning shields back on.
  if (wasOff && getState().onboarded && getState().shieldsBackOnDay !== dayKey()) {
    setState({ shieldsBackOnDay: dayKey() });
    return award(5, 'Turned shields back on');
  }
  return null;
}

export function liftAllShields(why = 'your shields went off') {
  if (ios) DA.stopMonitoring([PASS_ACTIVITY]);
  setState({ shieldsOn: false, offUntil: 0 });
  syncShields();
  if (getState().onboarded) breakDay(why);
}

/** "Turn off till tomorrow": every shield comes off and returns by itself at 07:00. No XP lost. */
export function turnOffTillTomorrow() {
  const d = new Date();
  if (d.getHours() >= 7) d.setDate(d.getDate() + 1);
  d.setHours(7, 0, 0, 0);
  setState({ offUntil: d.getTime() });
  breakDay('you turned your shields off till tomorrow');
  syncShields();
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

  if (pass.urgent) {
    // Night lock's urgent door: 10 minutes, no check-in, no XP, doesn't count as a pass.
    setState({ pass });
  } else {
    const before = passesToday();
    setState((s) => ({
      pass,
      passesByDay: { ...s.passesByDay, [dayKey(now)]: (s.passesByDay[dayKey(now)] ?? 0) + 1 },
    }));
    if (before >= FREE_PASSES) breakDay('you used a third Shopping Pass');
    track('shopping_pass_started', { minutes: pass.minutes });
  }
  schedulePassEnd(pass).catch(() => {});
  return pass;
}

/** Ends the pass: re-shields the app and queues the check-in. Safe to call twice. */
export function endPass(early = false) {
  const { pass } = getState();
  if (!pass) return null;
  if (ios) {
    DA.removeSelectionFromWhitelistAndUpdateBlock({ activitySelectionId: PASS_APP_ID });
    DA.stopMonitoring([PASS_ACTIVITY]);
  }
  if (early) cancelPassEnd(pass);
  setState({ pass: null, pendingCheckIn: pass.urgent ? getState().pendingCheckIn : pass });
  return pass.urgent ? `${pass.app} is locked again. Sleep well.` : null;
}

/** Called on launch, on resume and every second while the app is open. Returns a toast, if any. */
export function tick() {
  const s = getState();
  const now = Date.now();
  if (s.offUntil && now >= s.offUntil) {
    setState({ offUntil: 0 });
    syncShields();
  }
  if (s.pass && now >= s.pass.endsAt) return endPass();
  return null;
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
    const h = BAND_HOURS[band] * (saleOn() ? 2 : 1);
    readyAt = from + h * 3600 * 1000;
    chips.push(`${BAND_LABEL[band]}: ${BAND_HOURS[band]} h`);
    if (saleOn()) chips.push('Sale week: ×2');
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
  return bump('decided');
}

export function readyWants(now = Date.now()) {
  return getState().parked.filter((w) => !w.decided && w.readyAt <= now);
}

/** Is the app from this pause one of your takeaway apps? (For backup dinner.) */
export function isTakeawayApp(fromShield: boolean) {
  if (!ios || !fromShield || !getState().takeawaysChosen) return false;
  try {
    const m = DA.intersection({ activitySelectionId: LAST_SHIELDED_ID }, { activitySelectionId: TAKEAWAYS_ID }, { stripToken: true });
    return (m?.applicationCount ?? 0) > 0;
  } catch {
    return false;
  }
}

export function logPause(app: string, outcome: 'left' | 'parked' | 'shop' | 'walked') {
  setState((s) => ({ pauseLog: [...s.pauseLog, { at: Date.now(), app, outcome }].slice(-200) }));
  // The late-night shield says "You left it N of the last M times" — the extension reads this.
  const recent = getState().pauseLog.filter((p) => p.app === app).slice(-5);
  const left = recent.filter((p) => p.outcome === 'left' || p.outcome === 'walked').length;
  if (ios) DA.userDefaultsSet(`tm_leftstats::${app}`, `${left}|${recent.length}`);
}
