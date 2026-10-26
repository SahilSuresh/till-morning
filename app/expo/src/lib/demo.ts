import { rankFor } from './xp';
import { dayKey, getState, type ParkedWant, type PauseOutcome, setState, type XpEntry } from './store';
import { thisWeek, WEEK1 } from './week';

// Sample data for screen recordings (App Store preview video, App Review demo), in test builds
// only (Settings → Test tools). It looks like about ten days of use: a few wants waiting in the
// trolley, one ready to decide, some let go, stickers, a parcel to open and a rank part-way up.
// Your shielded apps stay as they are: those come from Screen Time on the phone.
// Items have plain names (no shop or brand names) so the footage is safe to show.

const HOUR = 3600000;
const DAY = 24 * HOUR;
const APP = 'your shop apps'; // shows the item, not an app name

/** The next time it's hour:00, today or tomorrow. */
function nextAt(now: number, hour: number) {
  const d = new Date(now);
  d.setHours(hour, 0, 0, 0);
  if (d.getTime() <= now) d.setDate(d.getDate() + 1);
  return d.getTime();
}

export function fillDemoData() {
  const now = Date.now();
  let n = 0;
  const id = () => `demo-${now}-${n++}`;
  const want = (what: string, band: ParkedWant['band'], parkedAgo: number, readyAt: number, extra: Partial<ParkedWant> = {}): ParkedWant => ({
    id: id(),
    app: APP,
    what,
    band,
    parkedAt: now - parkedAgo,
    readyAt,
    ...extra,
  });

  const parked: ParkedWant[] = [
    // Waiting in the trolley
    want('Running trainers', '50to100', 2 * HOUR, nextAt(now, 8)),
    want('Wireless earbuds', '50to100', 5 * HOUR, now + 3 * HOUR + 20 * 60000),
    want('Desk lamp', 'under20', 40 * 60000, now + 11 * HOUR),
    // Ready to decide
    want('Denim jacket', '20to50', 14 * HOUR, now - 25 * 60000),
    // Decided earlier
    want('Scented candle set', 'under20', 9 * DAY, now - 8 * DAY, { decided: 'let_go', decidedAt: now - 8 * DAY + HOUR }),
    want('Phone case', 'under20', 8 * DAY, now - 7 * DAY, { decided: 'let_go', decidedAt: now - 7 * DAY + 2 * HOUR }),
    want('Gaming headset', 'over100', 6 * DAY, now - 5 * DAY, { decided: 'let_go', decidedAt: now - 5 * DAY + HOUR }),
    want('Birthday present for Mum', '20to50', 5 * DAY, now - 4 * DAY, { decided: 'kept', decidedAt: now - 4 * DAY + HOUR }),
    want('Throw blanket', '20to50', 3 * DAY, now - 2 * DAY, { decided: 'let_go', decidedAt: now - 2 * DAY + 3 * HOUR }),
    want('Sunglasses', '50to100', 2 * DAY, now - DAY, { decided: 'let_go', decidedAt: now - DAY + HOUR }),
  ];

  const outcomes: PauseOutcome['outcome'][] = ['left', 'parked', 'left', 'walked', 'parked', 'left', 'shop', 'left', 'parked', 'left', 'left', 'parked'];
  const pauseLog: PauseOutcome[] = outcomes.map((outcome, i) => ({ at: now - (outcomes.length - i) * 17 * HOUR, app: APP, outcome }));

  const log: XpEntry[] = [
    { at: now - 6 * DAY, amount: 10, label: 'Let a want go' },
    { at: now - 5 * DAY, amount: 10, label: 'Checked in after a pass' },
    { at: now - 4 * DAY, amount: 10, label: 'Decided to keep a want' },
    { at: now - 3 * DAY, amount: 10, label: 'Left the shop after the pause' },
    { at: now - 2 * DAY, amount: 10, label: 'Let a want go' },
    { at: now - DAY, amount: 10, label: 'Let a want go' },
    { at: now - 20 * HOUR, amount: 10, label: 'Walked away during the pause' },
    { at: now - 5 * HOUR, amount: 5, label: 'Parked a want' },
    { at: now - 2 * HOUR, amount: 5, label: 'Parked a want' },
    { at: now - 40 * 60000, amount: 5, label: 'Parked a want' },
  ];
  const total = 640; // Silver II, most of the way to Silver I

  setState({
    onboarded: true,
    appsChosen: true,
    shieldsOn: true,
    offUntil: 0,
    goal: 'Save £500 for summer',
    // A plan without the store's say-so: test builds never lapse while proSeen is false.
    subscribed: true,
    lapsed: false,
    proSeen: getState().proSeen && getState().subscribed,
    plan: 'yearly',
    trialAt: now - 10 * DAY,
    // Tour and tips already seen (Settings → Show the tips again brings them back)
    coachStep: -1,
    tabTips: { waiting: true, me: true },
    unlocked: WEEK1.map((u) => u.k),
    recapSeenWeek: thisWeek(now),
    rankSeen: rankFor(total).index,
    xp: { total, log },
    parked,
    pauseLog,
    pass: null,
    pendingCheckIn: null,
    passesByDay: {},
    checkinLog: [
      { at: now - 7 * DAY, answer: 'didnt_buy' },
      { at: now - 5 * DAY, answer: 'stuck' },
      { at: now - 3 * DAY, answer: 'stuck' },
    ],
    checkInsDone: 3,
    pauseHelped: { yes: 7, asked: 9 },
    cnt: { leave: 7, decided: 6, checkin: 3 },
    // Three stickers on the shelf and one parcel waiting on Today
    got: ['welcome', 'shieldm', 'puzzle'],
    queue: ['ticket'],
    // Eight calm nights on this Morning card
    day: dayKey(now),
    dayBroken: false,
    brokenWhy: '',
    stamps: 8,
    cardsFilled: 0,
    budgetTotal: 150,
    budgetSkipped: false,
    split: 'shared',
    passSet: true,
    setupHidden: true,
    meals: [
      { n: 'Pasta and pesto', e: '🍝', m: 12 },
      { n: 'Eggs on toast', e: '🍳', m: 5 },
    ],
    lastCheckAt: now,
  });
}
