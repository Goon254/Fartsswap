'use client';

import { useEffect, useState } from 'react';

/**
 * Animate a numeric value from 0 → `target` using requestAnimationFrame.
 *
 * Used for the headline power-score reveal so the number physically counts
 * up rather than appearing in place. Re-runs whenever `target` changes (so
 * variant switches re-animate the counter), and respects
 * `prefers-reduced-motion` by snapping straight to the final value.
 */
export function useCountUp(target: number, durationMs = 900): number {
  const [value, setValue] = useState(target);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setValue(target);
      return;
    }
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setValue(target);
      return;
    }
    let frame = 0;
    const startTime = performance.now();
    const startValue = 0;
    setValue(startValue);

    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(startValue + (target - startValue) * eased));
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return value;
}
