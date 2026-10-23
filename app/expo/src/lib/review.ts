import * as StoreReview from 'expo-store-review';

import { getState, setState } from './store';
import { dayIn } from './week';
import { rankFor } from './xp';

const DAY = 86400000;

/**
 * Review request (L1830): Apple's own pop-up, right after a calm win (letting a parked want go).
 * Never in setup, the shield, the pause, the paywall or after a slip. At most 3 a year, 120 days apart.
 */
export function canAskReview(now = Date.now()) {
  const s = getState();
  const asked = s.rateAsked.filter((t) => now - t < 365 * DAY);
  const lets = s.parked.filter((w) => w.decided === 'let_go').length;
  const rankUp = rankFor(s.xp.total).index > s.rankSeen;
  return s.subscribed && !rankUp && dayIn(now) >= 4 && lets >= 2 && !s.dayBroken && asked.length < 3 && !asked.some((t) => now - t < 120 * DAY);
}

export function maybeAskReview() {
  if (!canAskReview()) return;
  setTimeout(async () => {
    try {
      if (!(await StoreReview.hasAction())) return;
      setState((s) => ({ rateAsked: [...s.rateAsked, Date.now()].slice(-5) }));
      await StoreReview.requestReview();
    } catch {
      // Apple decides whether the pop-up shows; nothing to do if it doesn't.
    }
  }, 1400);
}
