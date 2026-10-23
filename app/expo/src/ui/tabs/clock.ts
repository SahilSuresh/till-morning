import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

// Tab screens never tick on a timer. They re-read the clock only when something on screen can
// change: on focus, when the app comes to the foreground, at the top of each hour (greeting,
// night lock, risky hour, Sunday recap) and at any extra moment passed in (a want becoming ready).

let foregroundAt = Date.now();
AppState.addEventListener('change', (s) => {
  if (s === 'active') foregroundAt = Date.now();
});

/** When Till Morning last came to the foreground, which is when it re-applies the shields. */
export const lastSeenAt = () => foregroundAt;

/** The longest a setTimeout can wait. */
const MAX_WAIT = 2 ** 31 - 1;

/** The next moment worth re-rendering for: the next hour, or an earlier time from `times`. */
function nextBoundary(now: number, times: readonly number[]) {
  const hour = new Date(now);
  hour.setMinutes(60, 0, 0);
  let next = hour.getTime();
  for (const t of times) if (t > now && t < next) next = t;
  return next;
}

export function useBoundaryNow(times: readonly number[] = []) {
  const [now, setNow] = useState(Date.now);

  useFocusEffect(
    useCallback(() => {
      setNow(Date.now());
    }, []),
  );

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') setNow(Date.now());
    });
    return () => sub.remove();
  }, []);

  const next = nextBoundary(now, times);
  useEffect(() => {
    const t = setTimeout(() => setNow(Date.now()), Math.min(MAX_WAIT, Math.max(0, next - Date.now()) + 30));
    return () => clearTimeout(t);
  }, [next]);

  return now;
}

/** Re-renders every `ms` while the screen is focused (for small live labels only). */
export function useTickWhileFocused(ms: number) {
  const [now, setNow] = useState(Date.now);
  useFocusEffect(
    useCallback(() => {
      setNow(Date.now());
      const t = setInterval(() => setNow(Date.now()), ms);
      return () => clearInterval(t);
    }, [ms]),
  );
  return now;
}

/** "just now", "4 min ago", "2 h ago". */
export function ago(at: number, now = Date.now()) {
  const m = Math.floor((now - at) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  return `${Math.floor(m / 60)} h ago`;
}
