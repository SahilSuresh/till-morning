import type { ImageSourcePropType } from 'react-native';

import { dayKey, getState, setState } from './store';
import { award } from './xp';

// Morning card (prototype rollDay/endDay/stampAdd/breakDay):
// one stamp for every calm day — shields on all day and 2 Shopping Passes or fewer.
// Missing a day just means no stamp, never a penalty. Days away with shields on still count.
// Ten stamps fill a card: +50 XP (outside the daily cap) and a fresh card.

export const FREE_PASSES = 2;

function daysBetween(a: string, b: string) {
  const parse = (k: string) => {
    const [y, m, d] = k.split('-').map(Number);
    return new Date(y, m - 1, d).getTime();
  };
  return Math.max(1, Math.round((parse(b) - parse(a)) / 86400000));
}

function stampAdd(n: number) {
  const s = getState();
  let stamps = s.stamps + n;
  let cards = s.cardsFilled;
  while (stamps >= 10) {
    stamps -= 10;
    cards += 1;
    award(50, 'Filled a Morning card', { free: true });
  }
  setState({ stamps, cardsFilled: cards });
}

/** Call on launch and resume: closes out any days that ended since we last looked. */
export function rollDay() {
  const s = getState();
  const today = dayKey();
  if (!s.day) {
    setState({ day: today });
    return;
  }
  if (s.day === today) return;
  const gap = Math.min(daysBetween(s.day, today), 10);
  let add = 0;
  if (s.onboarded) {
    if (!s.dayBroken) add += 1; // the day that just ended
    if (s.shieldsOn) add += gap - 1; // days away with shields on still earn stamps
  }
  setState({ day: today, dayBroken: false, brokenWhy: '' });
  if (add) stampAdd(add);
  checkGoals();
}

/** This day won't get a stamp. The first reason sticks. */
export function breakDay(why: string) {
  rollDay();
  if (!getState().dayBroken) setState({ dayBroken: true, brokenWhy: why });
}

// ---- Sticker goals --------------------------------------------------------

export type StickerKey = 'welcome' | 'shieldm' | 'ticket' | 'puzzle' | 'cape' | 'bubble' | 'receipt' | 'wallet' | 'legend';

export const STICKER_NAME: Record<StickerKey, string> = {
  welcome: 'Pause button',
  shieldm: 'Wait sign',
  ticket: 'Access ticket',
  puzzle: 'Puzzle shield',
  cape: 'Caped saver',
  bubble: 'Garden thinker',
  legend: 'Legend set',
  receipt: 'Receipt hero',
  wallet: 'Iron wallet',
};

export const STICKER_IMG: Partial<Record<StickerKey, ImageSourcePropType>> = {
  welcome: require('../../assets/mascots/welcome.webp'),
  shieldm: require('../../assets/mascots/shieldm.webp'),
  ticket: require('../../assets/mascots/ticket.webp'),
  puzzle: require('../../assets/mascots/puzzle.webp'),
  cape: require('../../assets/mascots/cape.webp'),
  bubble: require('../../assets/mascots/bubble.webp'),
  legend: require('../../assets/mascots/legend.webp'),
};

const letGoCount = () => getState().parked.filter((w) => w.decided === 'let_go').length;
const cnt = (k: keyof ReturnType<typeof getState>['cnt']) => getState().cnt[k] ?? 0;

export const GOALS: { k: StickerKey; task: string; n: number; get: () => number; special?: boolean }[] = [
  { k: 'welcome', task: 'Leave at the pause 5 times', n: 5, get: () => cnt('leave') },
  { k: 'shieldm', task: 'Decide on 3 parked wants in the morning', n: 3, get: () => cnt('decided') },
  { k: 'ticket', task: 'Finish 3 Shopping Passes and check in', n: 3, get: () => cnt('checkin') },
  { k: 'puzzle', task: 'Let go of 5 things', n: 5, get: letGoCount },
  { k: 'cape', task: 'Fill a Morning card: 10 calm days', n: 10, get: () => getState().cardsFilled * 10 + getState().stamps },
  { k: 'bubble', task: 'Let go of 15 things', n: 15, get: letGoCount },
  { k: 'receipt', task: 'Prove you stayed under your limit', n: 1, get: () => cnt('underLimit'), special: true },
  { k: 'wallet', task: 'Prove it 5 times: under your limit, with a screenshot', n: 5, get: () => cnt('underLimit'), special: true },
  { k: 'legend', task: 'Finish a 30-day challenge', n: 30, get: () => 0 },
];

const PASS_STEPS = [
  'On Today, tap “Need to shop? Get a pass”',
  'Say what you need and set a limit, then tear the ticket',
  'When the pass ends, tap the check-in and answer honestly',
];

/** Each sticker goal explained: what counts, the steps, and one button that starts it (GOAL_HOW). */
export const GOAL_HOW: Record<
  StickerKey,
  { what: string; steps: string[]; cta: [string, 'pause' | 'waiting' | 'ready' | 'pass' | 'back' | 'settings']; today?: () => string }
> = {
  welcome: {
    what: 'Each time you open a shielded app, wait out the breathing pause, then choose “I’ll leave it”.',
    steps: ['Open a shielded app from your home screen', 'Tap “I still want to shop” and breathe through the pause', 'Tap “I’ll leave it”. That’s one.'],
    cta: ['Got it', 'back'],
  },
  shieldm: {
    what: 'A want you parked, decided after its wait is over. Keep it or let it go: both count.',
    steps: ['At the pause, tap “Park it till morning”', 'Wait till it’s ready, usually 08:00', 'Open Waiting, tap it and decide'],
    cta: ['Open your waiting room', 'waiting'],
  },
  ticket: { what: 'A Shopping Pass you finish and then check in on. Any honest answer counts.', steps: PASS_STEPS, cta: ['Get a pass', 'pass'] },
  puzzle: {
    what: 'When a parked want is ready and you choose “Let it go”. Each one goes on your Let go shelf.',
    steps: ['Park something at the pause', 'When it’s ready, open Waiting and tap it', 'Choose “Let it go”'],
    cta: ['Open your waiting room', 'ready'],
  },
  cape: {
    what: 'A calm day is any day you keep your shields on and use 2 Shopping Passes or fewer. You don’t need to do anything else.',
    steps: [
      'Keep your shields on all day (switching them off or “Turn off till tomorrow” breaks the day)',
      'Use no more than 2 Shopping Passes',
      'At midnight the day gets a stamp on your Morning card. 10 stamps fill the card and earn this sticker.',
    ],
    today: () => {
      const s = getState();
      return s.dayBroken
        ? `Today won’t get a stamp: ${s.brokenWhy || 'the day was broken'}. Tomorrow is a fresh start.`
        : 'Today is calm so far. Its stamp lands at midnight.';
    },
    cta: ['Got it', 'back'],
  },
  bubble: {
    what: 'Fifteen parked wants you chose to let go. They all sit on your Let go shelf.',
    steps: ['Park something at the pause', 'When it’s ready, open Waiting and tap it', 'Choose “Let it go”'],
    cta: ['Open your waiting room', 'ready'],
  },
  receipt: {
    what: 'After a pass, add a screenshot of your checkout at check-in. If the total is under the limit you set, it counts.',
    steps: ['Get a pass and set a limit (£)', 'Buy what you planned', 'At check-in, add your checkout screenshot'],
    cta: ['Get a pass', 'pass'],
  },
  wallet: {
    what: 'Five passes where your checkout screenshot shows you stayed under your limit.',
    steps: ['Get a pass and set a limit (£)', 'Buy what you planned', 'At check-in, add your checkout screenshot'],
    cta: ['Get a pass', 'pass'],
  },
  legend: {
    what: 'Pick a 30-day challenge in Your rules, like a no-buy month, and reach day 30.',
    steps: ['Open Your rules and pick a challenge', 'Keep going, one day at a time', 'Day 30 earns the sticker'],
    today: () => 'No challenge picked yet.',
    cta: ['Pick a challenge', 'settings'],
  },
};

/** Counts a sticker-goal action; returns toast copy if a goal just finished. */
export function bump(k: keyof ReturnType<typeof getState>['cnt']) {
  setState((s) => ({ cnt: { ...s.cnt, [k]: (s.cnt[k] ?? 0) + 1 } }));
  return goalToast(checkGoals());
}

export function goalToast(done: StickerKey[]) {
  return done.length ? `Sticker goal done: ${STICKER_NAME[done[0]]} · a parcel is on Today` : null;
}

/** Finished goals queue a parcel; returns the stickers that just finished. */
export function checkGoals() {
  const s = getState();
  const done = GOALS.filter((g) => !s.got.includes(g.k) && !s.queue.includes(g.k) && g.get() >= g.n).map((g) => g.k);
  if (done.length) setState({ queue: [...s.queue, ...done] });
  return done;
}

/** Opens the next parcel: the sticker moves from the queue to your shelf. */
export function openParcel(): StickerKey | null {
  const s = getState();
  const k = s.queue[0] as StickerKey | undefined;
  if (!k) return null;
  setState({ queue: s.queue.slice(1), got: [...s.got, k] });
  return k;
}
