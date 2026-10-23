import { useEffect, useState } from 'react';

import { measureSpot, type SpotRect, type SpotRef } from '../Spotlight';

/**
 * Measures a coach or tab-tip target once it has laid out: after `delay`, then once more
 * 350 ms later (the target may still be finishing its rise-in). Pill shapes pass a large
 * radius; it is capped at half the height. Null while inactive or not on screen.
 */
export function useTarget(ref: SpotRef | null, active: boolean, radius: number, delay: number) {
  const [rect, setRect] = useState<SpotRect | null>(null);
  useEffect(() => {
    if (!active || !ref) return;
    let live = true;
    const measure = () =>
      measureSpot(ref, radius).then((r) => {
        if (live) setRect(r ? { ...r, radius: Math.min(r.radius, r.height / 2) } : null);
      });
    const a = setTimeout(measure, delay);
    const b = setTimeout(measure, delay + 350);
    return () => {
      live = false;
      clearTimeout(a);
      clearTimeout(b);
    };
  }, [ref, active, radius, delay]);
  // Between steps the last outline stays put until the next target is measured.
  return active ? rect : null;
}
