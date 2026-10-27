import { getState } from './store';

/** Day of the free week, starting at 1 on the day the trial began. */
export function dayIn(now = Date.now()) {
  const { trialAt } = getState();
  return trialAt ? Math.floor((now - trialAt) / 86400000) + 1 : 1;
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
  { t: 'Now try it once', d: 'Open a shielded app from your Home Screen and park something. Everything you park waits here.' },
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
