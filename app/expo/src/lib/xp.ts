import { dayKey, getState, setState } from './store';

// XP rules from the v18 prototype (award(), line 893):
// - 60 XP daily cap (Morning card fills are outside the cap)
// - at most 5 rewarded shield closes a day
// - close/pause XP for the same app at most once every 30 minutes
// - XP never drops below the start of your current rank

export const DAILY_CAP = 60;
export const MAX_CLOSES_PER_DAY = 5;
export const XP_GAP_MIN = 30;

const METALS = [
  { metal: 'Bronze', title: 'Window Shopper', at: [0, 100, 200] },
  { metal: 'Silver', title: 'Mindful Browser', at: [300, 500, 700] },
  { metal: 'Gold', title: 'Cart Controller', at: [900, 1250, 1600] },
  { metal: 'Platinum', title: 'Checkout Guardian', at: [2000, 2500, 3000] },
  { metal: 'Diamond', title: 'Impulse Breaker', at: [3500, 4300, 5100] },
  { metal: 'Legend', title: 'Spending Strategist', at: [6000, 7500, 9000] },
] as const;
const TIERS = ['III', 'II', 'I'] as const;

export const RANKS = METALS.flatMap((m) =>
  m.at.map((threshold, i) => ({ name: `${m.metal} ${TIERS[i]}`, metal: m.metal, title: m.title, threshold })),
);

export function rankFor(total: number) {
  let idx = 0;
  RANKS.forEach((r, i) => {
    if (total >= r.threshold) idx = i;
  });
  return { rank: RANKS[idx], next: RANKS[idx + 1] ?? null, index: idx };
}

export function earnedToday() {
  const today = dayKey();
  return getState()
    .xp.log.filter((e) => e.amount > 0 && !e.label.startsWith('free:') && dayKey(e.at) === today)
    .reduce((sum, e) => sum + e.amount, 0);
}

export type AwardResult =
  | { ok: true; amount: number }
  | { ok: false; reason: 'cap' | 'gap' | 'closes'; minutesLeft?: number };

type AwardOptions = { app?: string; gap?: boolean; isClose?: boolean; free?: boolean; at?: number };

export function award(amount: number, label: string, opts: AwardOptions = {}): AwardResult {
  const s = getState();
  const at = opts.at ?? Date.now();

  if (opts.app && opts.gap) {
    const last = s.lastXpByApp[opts.app] ?? 0;
    const mins = (at - last) / 60000;
    if (mins < XP_GAP_MIN) return { ok: false, reason: 'gap', minutesLeft: Math.ceil(XP_GAP_MIN - mins) };
  }
  if (opts.isClose && (s.closesByDay[dayKey(at)] ?? 0) >= MAX_CLOSES_PER_DAY) {
    return { ok: false, reason: 'closes' };
  }

  let give = amount;
  if (!opts.free) {
    const room = DAILY_CAP - earnedToday();
    if (room <= 0) return { ok: false, reason: 'cap' };
    give = Math.min(amount, room);
  }

  setState((st) => ({
    xp: { total: st.xp.total + give, log: [...st.xp.log, { at, amount: give, label, app: opts.app }].slice(-300) },
    lastXpByApp: opts.app && opts.gap ? { ...st.lastXpByApp, [opts.app]: at } : st.lastXpByApp,
    closesByDay: opts.isClose
      ? { ...st.closesByDay, [dayKey(at)]: (st.closesByDay[dayKey(at)] ?? 0) + 1 }
      : st.closesByDay,
  }));
  return { ok: true, amount: give };
}

/** Losses only for weakening your own protection, and never below your rank's floor. */
export function lose(amount: number, label: string) {
  setState((st) => {
    const floor = rankFor(st.xp.total).rank.threshold;
    const next = Math.max(floor, st.xp.total - amount);
    const lost = st.xp.total - next;
    if (lost <= 0) return {};
    return { xp: { total: next, log: [...st.xp.log, { at: Date.now(), amount: -lost, label }].slice(-300) } };
  });
}

/** Toast copy for an award, matching the prototype's wording. */
export function xpToast(result: AwardResult, text: string) {
  if (result.ok) return `+${result.amount} XP · ${text}`;
  if (result.reason === 'gap') return `No XP for a repeat, next in ${result.minutesLeft} min · ${text}`;
  if (result.reason === 'closes') return `${text} · closing XP used up for today`;
  return `Daily XP cap reached · ${text}`;
}
