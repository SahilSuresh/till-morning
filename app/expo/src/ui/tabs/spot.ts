import { useEffect, useState } from 'react';

import { measureSpot, type SpotRect, type SpotRef } from '../Spotlight';

const same = (a: SpotRect, b: SpotRect) =>
  Math.abs(a.x - b.x) < 1 && Math.abs(a.y - b.y) < 1 && Math.abs(a.width - b.width) < 1 && Math.abs(a.height - b.height) < 1;

/**
 * Measures a coach or tab-tip target once it has stopped moving: from `delay`, it measures every
 * 90 ms until two measurements agree (the screen may still be rising or sliding in), and only
 * then hands back the rect, once. So the tip appears once, in the right place, and never jumps
 * or flashes. Pill shapes pass a large radius; it is capped at half the height.
 * Null while there's no target, or while a new target (`key`) is still being measured.
 */
export function useTarget(target: { key: string; ref: SpotRef } | null, radius: number, delay: number) {
  const key = target?.key ?? null;
  const ref = target?.ref ?? null;
  const [got, setGot] = useState<{ key: string; rect: SpotRect } | null>(null);
  useEffect(() => {
    if (!key || !ref) return;
    let live = true;
    let last: SpotRect | null = null;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = () =>
      measureSpot(ref, radius).then((r) => {
        if (!live) return;
        tries += 1;
        if (r && ((last && same(r, last)) || tries >= 16)) {
          setGot({ key, rect: { ...r, radius: Math.min(r.radius, r.height / 2) } });
          return;
        }
        last = r;
        timer = setTimeout(tick, 90);
      });
    timer = setTimeout(tick, delay);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [key, ref, radius, delay]);
  return key && got?.key === key ? got.rect : null;
}
