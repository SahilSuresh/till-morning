import * as ImagePicker from 'expo-image-picker';

import { recognizeText } from '../../modules/tm-native';

/** Opens the photo library for one screenshot. No permission prompt: iOS's picker is private. */
export async function pickScreenshot(): Promise<string | null> {
  const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1, allowsMultipleSelection: false });
  if (r.canceled) return null;
  return r.assets[0]?.uri ?? null;
}

const AMOUNT = /(?:£|GBP\s?|\$|€)\s?(\d{1,5}(?:[.,]\d{1,2})?)|(?:^|[^\d.,£$€])(\d{1,5}[.,]\d{2})(?!\d)/g;

function amounts(line: string): number[] {
  const out: number[] = [];
  for (const m of line.matchAll(AMOUNT)) {
    const raw = (m[1] ?? m[2] ?? '').replace(',', '.');
    const v = parseFloat(raw);
    if (Number.isFinite(v) && v > 0) out.push(v);
  }
  return out;
}

/** The order total on a checkout or basket screenshot (prototype findTotal(), L2894). */
export function findTotal(lines: string[]): number | null {
  const isTotal = /\btotal\b|amount to pay|you pay|to pay/i;
  const notTotal = /sub-?total|items total|saving|discount|delivery|postage|shipping|vat|tax|before/i;
  // A line that is only prices (e.g. a crossed-out "£32.51" then the real "£18.12").
  const priceOnly = (l: string) => amounts(l).length > 0 && l.replace(AMOUNT, '').replace(/[^a-z]/gi, '').length <= 2;
  for (let i = lines.length - 1; i >= 0; i--) {
    const l = lines[i];
    if (!isTotal.test(l) || notTotal.test(l)) continue;
    // Shops show discounts as an old price struck through, then the price you pay: take the last.
    const found = [...amounts(l)];
    for (let j = i + 1; j < Math.min(lines.length, i + 4) && priceOnly(lines[j]); j++) found.push(...amounts(lines[j]));
    if (found.length) return found[found.length - 1];
  }
  // Fallback: the largest amount on the page, ignoring savings and old prices.
  let best = 0;
  for (const l of lines) {
    if (/subtotal|saving|was|rrp|save/i.test(l)) continue;
    for (const v of amounts(l)) best = Math.max(best, v);
  }
  return best || null;
}

/** "3 items", "Basket (3)", "Bag · 3 items" → 3. */
export function itemCount(lines: string[]): number | undefined {
  for (const l of lines) {
    const m = l.match(/\b(\d{1,2})\s+items?\b/i) ?? l.match(/\b(?:basket|bag|cart)\s*\((\d{1,2})\)/i);
    if (m) return parseInt(m[1], 10);
  }
  return undefined;
}

/** Reads a screenshot on this phone. The picture never leaves it. */
export async function readScreenshot(uri: string) {
  const lines = await recognizeText(uri);
  return { total: findTotal(lines), items: itemCount(lines) };
}
