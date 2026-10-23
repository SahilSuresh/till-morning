import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

// Everything Till Morning knows lives on the phone, in one small JSON document.
// No account, no server: see the privacy promise in the brief.

export type ChallengeKey = 'none' | 'nobuy' | 'lowbuy' | 'takeaway';
export type Habit ='takeaways' | 'shopping' | 'fashion' | 'social' | 'other';
export type PassReason = 'specific' | 'browsing' | 'unsure';
export type CheckInAnswer = 'stuck' | 'bought_else' | 'didnt_buy' | 'over';

export type ShoppingPass = {
  id: string;
  app: string; // display name, or 'your shop apps' when started from Home
  wholeSelection: boolean; // true when the pass opened every protected app
  urgent?: boolean; // night lock's urgent door: 10 minutes, no check-in
  fromRoom?: boolean; // started after deciding to keep a want: no pause
  key?: string; // the app's token key, for Apple's own label (iOS hides names from apps)
  reason: PassReason;
  need: string;
  limit: string;
  minutes: number;
  startedAt: number;
  endsAt: number;
};

export type XpEntry = { at: number; amount: number; label: string; app?: string };

export type PriceBand = 'unsure' | 'under20' | '20to50' | '50to100' | 'over100' | 'exact';

export type ParkedWant = {
  id: string;
  app: string;
  what: string;
  band: PriceBand;
  parkedAt: number;
  readyAt: number;
  price?: number; // exact price, from a basket screenshot
  items?: number;
  buddy?: boolean; // a friend let it skip the wait
  key?: string; // the app's token key, so a kept want unlocks just that app
  decided?: 'let_go' | 'kept';
  decidedAt?: number;
};

export type PauseOutcome = { at: number; app: string; outcome: 'left' | 'parked' | 'shop' | 'walked' };

export type AppState = {
  version: 1;
  onboarded: boolean;
  appsChosen: boolean;
  shieldsOn: boolean;
  goal: string;
  settings: {
    pauseSeconds: number;
    askQuestion: boolean;
    coolOffMinutes: number; // 0 = off
    passPresets: [number, number, number];
    defaultPassMinutes: number;
    shieldMsg: string; // shown first on every shield (60 chars)
    nlOn: boolean; // night lock
    nlFrom: number; // 22 | 23 | 0
    nlTo: number; // 6 | 7 | 8
    schedule: 'all' | 'evenings' | 'weekends';
    sale: boolean; // sale week: waits ×2, pause +15 s
    wage: number; // £ per hour, for "about X of your work"
    challenge: ChallengeKey;
    challengeAt: number;
    treats: number[]; // treat nights, Monday = 0
  };
  subscribed: boolean;
  plan: 'yearly' | 'monthly';
  trialAt: number;
  rankSeen: number; // index of the last rank celebrated
  unlocked: string[]; // week-one feature cards seen
  recapSeenWeek: number;
  tabTips: Record<string, boolean>;
  coachStep: number; // -1 = done
  meals: { n: string; e: string; m: number }[]; // backup dinner, up to 3
  checkinLog: { at: number; answer: CheckInAnswer }[];
  offUntil: number; // "Turn off till tomorrow": shields come back at this time
  reasons: Record<string, number>; // "What's this one about?" answers
  takeawaysChosen: boolean; // a takeaway selection exists for treat nights
  pass: ShoppingPass | null;
  pendingCheckIn: ShoppingPass | null;
  passesByDay: Record<string, number>;
  xp: { total: number; log: XpEntry[] };
  lastXpByApp: Record<string, number>;
  closesByDay: Record<string, number>;
  checkInsDone: number;
  pauseHelped: { yes: number; asked: number };
  parked: ParkedWant[];
  pauseLog: PauseOutcome[];
  coolOffs: Record<string, number>; // app name -> unlock time (ms), for Home
  lastShieldLogAt: number;
  // Morning card: one stamp per calm day (shields on all day, 2 passes or fewer)
  day: string; // the day the counters below belong to
  dayBroken: boolean;
  brokenWhy: string;
  stamps: number;
  cardsFilled: number;
  shieldsBackOnDay: string; // +5 XP once a day for turning shields back on
  // Sticker goals: counters, earned stickers and parcels waiting to be opened
  cnt: Partial<Record<'leave' | 'decided' | 'checkin' | 'underLimit', number>>;
  got: string[];
  queue: string[];
  // Monthly budget and the bank limit (self-reported)
  budgetTotal: number; // £ a month, 0 = no budget
  split: 'shared' | 'even' | 'custom';
  budgets: Record<string, number>; // app name -> £ a month, for "I'll choose"
  budgetSkipped: boolean;
  bankSteps: number[];
  bankLock: { at: number; amount: number } | null;
  // Finish setting up card on Today
  passSet: boolean;
  setupHidden: boolean;
  // Subscription lifecycle and review requests
  proSeen: boolean; // the store has confirmed an active plan at least once
  lapsed: boolean; // plan ended: every shield lifted until they resubscribe
  rateAsked: number[];
  // Your apps: habit per app and apps switched off (keys from the native module)
  habits: Record<string, Habit>;
  offApps: string[];
  // Note from calm you: a recording on this phone, plus the words it was based on
  note: { uri: string; text: string; secs: number } | null;
  // Ask a friend: one text to let something over £50 skip the wait
  buddy: { on: boolean; name: string; phone: string };
  lastCheckAt: number; // last time the app confirmed the shields are in place
};

export const initialState: AppState = {
  version: 1,
  onboarded: false,
  appsChosen: false,
  shieldsOn: true,
  goal: '',
  settings: {
    pauseSeconds: 15,
    askQuestion: false,
    coolOffMinutes: 10,
    passPresets: [5, 10, 15],
    defaultPassMinutes: 10,
    shieldMsg: '',
    nlOn: true,
    nlFrom: 23,
    nlTo: 7,
    schedule: 'all',
    sale: false,
    wage: 12,
    challenge: 'none',
    challengeAt: 0,
    treats: [4],
  },
  subscribed: false,
  plan: 'yearly',
  trialAt: 0,
  rankSeen: 0,
  unlocked: [],
  recapSeenWeek: 0,
  tabTips: {},
  coachStep: -1,
  meals: [],
  checkinLog: [],
  offUntil: 0,
  reasons: {},
  takeawaysChosen: false,
  pass: null,
  pendingCheckIn: null,
  passesByDay: {},
  xp: { total: 0, log: [] },
  lastXpByApp: {},
  closesByDay: {},
  checkInsDone: 0,
  pauseHelped: { yes: 0, asked: 0 },
  parked: [],
  pauseLog: [],
  coolOffs: {},
  lastShieldLogAt: 0,
  day: '',
  dayBroken: false,
  brokenWhy: '',
  stamps: 0,
  cardsFilled: 0,
  shieldsBackOnDay: '',
  cnt: {},
  got: [],
  queue: [],
  budgetTotal: 0,
  split: 'shared',
  budgets: {},
  budgetSkipped: false,
  bankSteps: [],
  bankLock: null,
  passSet: false,
  setupHidden: false,
  proSeen: false,
  lapsed: false,
  rateAsked: [],
  habits: {},
  offApps: [],
  note: null,
  buddy: { on: false, name: '', phone: '' },
  lastCheckAt: 0,
};

const KEY = 'tm_state_v1';
let state: AppState = initialState;
let loaded = false;
const listeners = new Set<() => void>();

export async function loadState() {
  if (loaded) return state;
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<AppState>;
      state = { ...initialState, ...saved, settings: { ...initialState.settings, ...saved.settings } };
    }
  } catch {
    // A broken save starts fresh rather than crashing the app.
  }
  loaded = true;
  listeners.forEach((l) => l());
  return state;
}

export function getState() {
  return state;
}

export function setState(update: Partial<AppState> | ((s: AppState) => Partial<AppState>)) {
  const patch = typeof update === 'function' ? update(state) : update;
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
  AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
}

export function resetState() {
  state = initialState;
  listeners.forEach((l) => l());
  return AsyncStorage.removeItem(KEY);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAppState<T>(select: (s: AppState) => T): T {
  return useSyncExternalStore(subscribe, () => select(state));
}

export function useLoaded() {
  return useSyncExternalStore(subscribe, () => loaded);
}

export function dayKey(at = Date.now()) {
  const d = new Date(at);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
