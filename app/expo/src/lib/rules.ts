import { type ChallengeKey, getState } from './store';

// "Your rules" from the prototype: challenges, treat nights, night lock, risky hour,
// sale week, when to shield and prices as hours of work.

export const CHALLENGES: Record<
  ChallengeKey,
  { name: string; sub: string; len: number; allowed: string | null; line: (day: number) => string }
> = {
  nobuy: {
    name: 'No-buy month',
    sub: 'Only what you need for 30 days. Groceries and gifts are fine.',
    len: 30,
    allowed: 'groceries or a gift',
    line: (d) => `Day ${d} of your no-buy month. Groceries and gifts only.`,
  },
  lowbuy: {
    name: 'Low-buy month',
    sub: 'One planned buy this month. Everything else waits.',
    len: 30,
    allowed: 'my one planned buy',
    line: () => 'Low-buy month: one planned buy. Is this it?',
  },
  takeaway: {
    name: 'Takeaway-free weekdays',
    sub: 'Takeaways only at weekends or on treat nights.',
    len: 28,
    allowed: null,
    line: () => 'Takeaway-free weekdays. Is tonight a treat night?',
  },
  none: { name: 'No challenge for now', sub: 'Just the pause and the waiting room.', len: 0, allowed: null, line: () => '' },
};

export function challengeDay(now = Date.now()) {
  const { challenge, challengeAt } = getState().settings;
  if (challenge === 'none' || !challengeAt) return 0;
  const start = new Date(challengeAt);
  start.setHours(0, 0, 0, 0);
  return Math.floor((now - start.getTime()) / 86400000) + 1;
}

export function activeChallenge() {
  const key = getState().settings.challenge;
  const ch = CHALLENGES[key];
  return ch.len ? { key, ...ch, day: Math.min(challengeDay(), ch.len) } : null;
}

/** The pause's third choice: "I need it now", or the challenge's allowed reason. */
export function shopLinkLabel() {
  const ch = activeChallenge();
  return ch?.allowed ? `It’s ${ch.allowed}` : 'I need it now';
}

// ---- Night lock and risky hour -------------------------------------------

export const NIGHT_FROM = 22; // risky hour starts

export const hh = (h: number) => `${String(h % 24).padStart(2, '0')}:00`;

/** Is the night lock window active at this moment? Handles windows that cross midnight. */
export function nightOn(now = Date.now()) {
  const { nlOn, nlFrom, nlTo } = getState().settings;
  if (!nlOn) return false;
  const h = new Date(now).getHours();
  return nlFrom > nlTo ? h >= nlFrom || h < nlTo : h >= nlFrom && h < nlTo;
}

export const risky = (now = Date.now()) => new Date(now).getHours() >= NIGHT_FROM;
export const saleOn = () => getState().settings.sale;

/** Pause length: your setting, at least 45 s in the risky hour, +15 s in sale week. */
export function pauseSeconds(now = Date.now()) {
  let s = getState().settings.pauseSeconds;
  if (risky(now)) s = Math.max(s, 45);
  if (saleOn()) s += 15;
  return s;
}

// ---- Treat nights and when to shield -------------------------------------

export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const dow = (now = Date.now()) => (new Date(now).getDay() + 6) % 7; // Monday = 0
export const isTreatNight = (now = Date.now()) => getState().settings.treats.includes(dow(now));

export function nextTreat(now = Date.now()) {
  const treats = getState().settings.treats;
  for (let i = 1; i <= 7; i++) {
    const d = (dow(now) + i) % 7;
    if (treats.includes(d)) return { name: DAY_NAMES[d], days: i };
  }
  return null;
}

/** Should the shields be up right now under "When to shield"? */
export function inSchedule(now = Date.now()) {
  const { schedule } = getState().settings;
  const d = new Date(now);
  if (schedule === 'evenings') return d.getHours() >= 18 || d.getHours() < 6;
  if (schedule === 'weekends') return d.getDay() === 0 || d.getDay() === 6;
  return true;
}

export const SCHEDULE_LABEL = {
  all: 'All day',
  evenings: 'Evenings',
  weekends: 'Weekends',
} as const;

// ---- Prices as hours of work ---------------------------------------------

export function workTime(price: number) {
  const mins = Math.round((price / (getState().settings.wage || 12)) * 60);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h ? `${h} h${m ? ` ${m} min` : ''}` : `${m} min`;
}
