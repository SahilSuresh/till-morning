import { Platform } from 'react-native';
import * as DA from 'react-native-device-activity';

import { appKeys, hasTmNative, saveAppsSelection } from '../../modules/tm-native';
import { evenShare, knownApps, money } from './budget';
import { activeChallenge } from './rules';
import { getState, type Habit } from './store';

const ios = Platform.OS === 'ios';
const PROTECTED_ID = 'tm_protected';
const LAST_SHIELDED_ID = 'tm_last_shielded';

export const HABITS: Habit[] = ['takeaways', 'shopping', 'fashion', 'social', 'other'];
export const HABIT_LABEL: Record<Habit, string> = {
  takeaways: 'Takeaways',
  shopping: 'Online shopping',
  fashion: 'Fashion',
  social: 'Social',
  other: 'Other',
};
/** Each shield is worded to fit the habit (SHIELD_LINE, L731). */
export const SHIELD_LINE: Record<Habit, string> = {
  takeaways: 'You wanted fewer takeaways. Is this order part of the plan?',
  shopping: 'Looking for something specific, or just browsing?',
  fashion: 'New clothes, or habit?',
  social: 'Here to scroll, or here to buy?',
  other: 'Is this a planned purchase?',
};

/** One protected app. `key` is its token key (native) or `name:<name>` on older installs. */
export type MyApp = { key: string; name: string | null; token: boolean };

export function appName(key: string): string | null {
  if (!ios || key.startsWith('name:')) return key.startsWith('name:') ? key.slice(5) : null;
  try {
    return DA.userDefaultsGet<string>(`tm_name::${key}`) ?? null;
  } catch {
    return null;
  }
}

/** Your protected apps, including ones switched off on the Your apps page. */
export function myApps(): MyApp[] {
  if (hasTmNative) {
    const off = getState().offApps;
    const keys = [...new Set([...appKeys(PROTECTED_ID), ...off])];
    return keys.map((key) => ({ key, name: appName(key), token: true }));
  }
  return knownApps().map((n) => ({ key: `name:${n}`, name: n, token: false }));
}

export function appCount() {
  if (!ios) return 0;
  try {
    return DA.activitySelectionMetadata({ activitySelectionId: PROTECTED_ID })?.applicationCount ?? 0;
  } catch {
    return 0;
  }
}

/** "You’ve got pasta and pesto or eggs on toast at home." for takeaway apps (mealLine, L1903). */
export function mealLine() {
  const meals = getState().meals.map((m) => m.n.charAt(0).toLowerCase() + m.n.slice(1));
  if (!meals.length) return '';
  const list = meals.length === 1 ? meals[0] : `${meals.slice(0, -1).join(', ')} or ${meals[meals.length - 1]}`;
  return `You’ve got ${list} at home.`;
}

export function budgetFor(key: string) {
  const s = getState();
  if (!s.budgetTotal || s.split === 'shared') return 0;
  return s.split === 'even' ? evenShare(s.budgetTotal, appCount()) : Math.max(0, s.budgets[key] || 0);
}

/** The shield's first line: your message → challenge → goal → the app's habit (L1427). */
export function shieldLine1(habit?: Habit) {
  const s = getState();
  const ch = activeChallenge();
  if (s.settings.shieldMsg.trim()) return s.settings.shieldMsg.trim();
  if (ch) return ch.line(ch.day);
  if (s.goal.trim()) return `You’re saving for ${s.goal.trim()}.`;
  return SHIELD_LINE[habit ?? 'other'];
}

/** The shield's second line: meals → app budget → total budget → waiting room (L1428–1431). */
export function shieldLine2(key?: string) {
  const s = getState();
  const habit = key ? s.habits[key] : undefined;
  if (habit === 'takeaways' && mealLine()) return mealLine();
  const own = key ? budgetFor(key) : 0;
  const name = key ? appName(key) : null;
  if (own) return name ? `${name} budget: ${money(own)} a month` : `Budget for this app: ${money(own)} a month`;
  if (s.budgetTotal) return `Shopping budget: ${money(s.budgetTotal)} a month`;
  const waiting = s.parked.filter((w) => !w.decided).length;
  if (waiting === 1) return '1 thing is already in your waiting room.';
  if (waiting > 1) return `${waiting} things are already in your waiting room.`;
  return '';
}

/** Writes each app's own shield lines for the Swift shield (tm_sub::key, tm_nightsub::key). */
export function writeAppLines() {
  if (!ios || !hasTmNative) return;
  try {
    DA.userDefaultsClearWithPrefix('tm_sub::');
    DA.userDefaultsClearWithPrefix('tm_nightsub::');
    const s = getState();
    for (const { key } of myApps()) {
      const l1 = shieldLine1(s.habits[key]);
      const l2 = shieldLine2(key);
      DA.userDefaultsSet(`tm_sub::${key}`, l2 ? `${l1}\n${l2}` : l1);
      if (s.habits[key] === 'takeaways' && mealLine()) DA.userDefaultsSet(`tm_nightsub::${key}`, mealLine());
    }
  } catch {
    // The shared subtitle still shows if this fails.
  }
}

/**
 * Picks one app as "the app you were opening", the same way the shield does,
 * so the pause, Shopping Pass and cool-off all apply to just that app.
 */
export function chooseApp(key: string) {
  if (!ios || !key || key.startsWith('name:')) return false;
  const ok = saveAppsSelection([key], LAST_SHIELDED_ID);
  if (!ok) return false;
  DA.userDefaultsSet('tm_last_shielded_key', key);
  DA.userDefaultsSet('tm_last_shielded_name', appName(key) ?? 'this app');
  DA.userDefaultsSet('tm_last_shielded_at', Date.now());
  return true;
}
