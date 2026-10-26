import { getState } from './store';

// Week one: a new feature card on Today each day of the free week (WEEK1 in the prototype).

export type UnlockKey = 'plan' | 'rules' | 'checkout' | 'stickers' | 'risky' | 'note';

export const WEEK1: { k: UnlockKey; day: number; kick: string; t: string; d: string; go?: string }[] = [
  {
    k: 'plan',
    day: 2,
    kick: 'When you really need something',
    t: 'Shop with a plan',
    d: 'Set a limit and the app opens for a while, then locks again. Stayed under? Show your checkout screenshot for bonus XP and a rare sticker.',
  },
  {
    k: 'rules',
    day: 3,
    kick: 'Decide while you’re calm',
    t: 'Your rules',
    d: 'Pick a challenge, like a no-buy month, and choose treat nights when takeaway apps open with a hello instead of a pause.',
    go: 'Set my rules',
  },
  {
    k: 'checkout',
    day: 4,
    kick: 'At checkout',
    t: 'Caught at checkout',
    d: 'When you park a want, pick a screenshot of your basket and Till Morning reads the total. Read on your phone, never sent anywhere.',
  },
  {
    k: 'stickers',
    day: 5,
    kick: 'Rewards you earn',
    t: 'Earn stickers, rank up',
    d: 'Finish real goals, like letting go of 5 things, to win stickers. Ranks take months to climb, and they never drop.',
    go: 'See my stickers',
  },
  {
    k: 'risky',
    day: 6,
    kick: 'Late nights and sale weeks',
    t: 'Tougher when you’re weakest',
    d: 'After 22:00 and in sale weeks, the pause gets longer and wants wait longer. Till Morning learns your risky hours on your phone.',
    go: 'See my rules',
  },
  {
    k: 'note',
    day: 7,
    kick: 'In every pause',
    t: 'A note from calm you',
    d: 'Record a few words while you feel calm. They play in your pause, right when the shops are loudest.',
    go: 'Record my note',
  },
];

/** Day of the free week, starting at 1 on the day the trial began. */
export function dayIn(now = Date.now()) {
  const { trialAt } = getState();
  return trialAt ? Math.floor((now - trialAt) / 86400000) + 1 : 1;
}

export function nextUnlock() {
  const s = getState();
  if (!s.subscribed) return null;
  return WEEK1.find((u) => dayIn() >= u.day && !s.unlocked.includes(u.k)) ?? null;
}

const weekNo = (at = Date.now()) => Math.floor(at / (7 * 86400000));

/** Sundays get a recap row, once a week. */
export function recapDue(now = Date.now()) {
  return getState().onboarded && new Date(now).getDay() === 0 && getState().recapSeenWeek !== weekNo(now);
}
export const thisWeek = weekNo;

export const COACH_TIPS = [
  { t: 'This is your trolley', d: 'When a want hits, park it here. It waits till morning with a timer on it, then you decide with a clear head.' },
  { t: 'Your shields are up', d: 'These shop apps get a little pause before they open. Tap the card to change which ones.' },
  { t: 'Need to shop for real?', d: 'Grab a pass: say what you need, set a limit and a timer. It all locks again after.' },
  { t: 'Now try it once', d: 'Open a shielded app from your Home Screen and park something. New tips land here all week.' },
];

export const TAB_TIPS: Record<string, { t: string; d: string }> = {
  waiting: { t: 'Everything you park waits here', d: 'When its timer runs out, you decide: let it go, or shop with a plan.' },
  me: { t: 'Your rank, stickers and calm nights', d: 'They only ever grow. Nothing here goes down, even on a wobbly day.' },
};

export const MEAL_IDEAS: [string, string, number][] = [
  ['Freezer pizza', '🍕', 15],
  ['Eggs on toast', '🍳', 5],
  ['Pasta and pesto', '🍝', 12],
  ['Beans on toast', '🥫', 5],
  ['Cheese toastie', '🧀', 8],
  ['Instant noodles', '🍜', 5],
];
