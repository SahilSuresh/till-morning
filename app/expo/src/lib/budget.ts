import { Platform } from 'react-native';
import * as DA from 'react-native-device-activity';

import { getState } from './store';

const ios = Platform.OS === 'ios';

/** £12, £12.50, or '' for nothing (prototype money()). */
export function money(v: number) {
  if (!v) return '';
  return `£${Number.isInteger(v) ? v : v.toFixed(2)}`;
}

/** Apps Till Morning knows by name: every app that has hit a shield or a pause on this phone. */
export function knownApps(): string[] {
  const names = new Set<string>();
  if (ios) {
    try {
      const all = DA.userDefaultsAll() ?? {};
      for (const [k, v] of Object.entries(all)) if (k.startsWith('tm_name::') && typeof v === 'string' && v) names.add(v);
    } catch {
      // Shared storage unavailable: fall back to the pause log.
    }
  }
  for (const p of getState().pauseLog) if (p.app && p.app !== 'your shop apps' && p.app !== 'Test app') names.add(p.app);
  return [...names].sort((a, b) => a.localeCompare(b));
}

export const evenShare = (total: number, n: number) => (n ? Math.floor((total / n) * 100) / 100 : 0);

/** Even split in £5 steps, the remainder on the first app (prototype fillSplit()). */
export function fillSplit(total: number, apps: string[]) {
  const out: Record<string, number> = {};
  if (!apps.length) return out;
  const each = Math.floor(total / apps.length / 5) * 5;
  apps.forEach((a) => (out[a] = each));
  out[apps[0]] = Math.round((total - each * (apps.length - 1)) * 100) / 100;
  return out;
}

export function splitLeft(total: number, budgets: Record<string, number>, apps: string[]) {
  return Math.round((total - apps.reduce((a, id) => a + (budgets[id] || 0), 0)) * 100) / 100;
}

export function splitStatus(total: number, left: number) {
  return left > 0 ? `${money(left)} left to share out` : left < 0 ? `${money(-left)} more than your total` : `All ${money(total)} shared out`;
}

export function budgetSummary() {
  const s = getState();
  if (!s.budgetTotal) return 'No budget set';
  return `${money(s.budgetTotal)} a month, ${{ shared: 'one pot for all apps', even: 'split evenly', custom: 'your own split' }[s.split]}`;
}

// ---- Bank limit seals --------------------------------------------------------

export const TIERS = [
  { name: 'Committed', from: 1, c: ['#B6FFE6', '#5EE9B5', '#1FB5C9', '#0E6E66'] },
  { name: 'Week strong', from: 7, c: ['#C9D3FF', '#7088FF', '#7B4DFF', '#3A2FB0'] },
  { name: 'Month proof', from: 30, c: ['#FFF3BF', '#FFC94D', '#FF8F3D', '#9C4A12'] },
  { name: 'Vault', from: 90, c: ['#FFD2F4', '#E663F5', '#7E3FF2', '#5B1E9E'] },
] as const;

export const tierFor = (days: number) => TIERS.reduce((t, x, i) => (days >= x.from ? i : t), 0);

/** Days since the bank limit was set, counting today as day 1. */
export function lockDays(at = getState().bankLock?.at) {
  if (!at) return 0;
  const a = new Date(at).setHours(0, 0, 0, 0);
  const b = new Date().setHours(0, 0, 0, 0);
  return Math.floor((b - a) / 86400000) + 1;
}
