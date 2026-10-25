import { memo, useEffect, useRef, useState } from 'react';

import { MoonBreath } from '../MoonBreath';

/**
 * The urgent door's wait, drawn as the moon timer (the same as the pause): the ring fills and the
 * moon waxes to full while you breathe. Ticks four times a second; `onDone` fires once at zero.
 */
export const CountRing = memo(function CountRing({ total, startedAt, onDone }: { total: number; startedAt: number; onDone: () => void }) {
  const [left, setLeft] = useState(() => Math.max(0, total - (Date.now() - startedAt) / 1000));
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const t = setInterval(() => {
      const l = Math.max(0, total - (Date.now() - startedAt) / 1000);
      setLeft(l);
      if (l <= 0) {
        clearInterval(t);
        doneRef.current();
      }
    }, 250);
    return () => clearInterval(t);
  }, [total, startedAt]);

  return <MoonBreath total={total} left={left} done={left <= 0} />;
});
