'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { FC } from 'react';

const EMBER_OFFSETS = [
  { left: '12%', delay: 0 },
  { left: '28%', delay: 0.4 },
  { left: '44%', delay: 0.9 },
  { left: '56%', delay: 0.2 },
  { left: '72%', delay: 1.1 },
  { left: '88%', delay: 0.6 },
] as const;

/**
 * Page-level hazard atmosphere for `/fartmaximizer` (fixed, non-interactive).
 */
export const FartmaximizerAmbience: FC = () => {
  const reduceMotion = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[5] overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_42%_at_50%_0%,color-mix(in_oklab,var(--color-alert-red)_14%,transparent),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_30%_at_80%_60%,color-mix(in_oklab,var(--color-alert-amber)_8%,transparent),transparent_65%)]" />

      {!reduceMotion ? (
        <>
          <motion.div
            className="absolute left-1/2 top-[18%] h-64 w-[min(90vw,42rem)] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
            style={{
              background:
                'radial-gradient(circle, color-mix(in oklab, var(--color-alert-red) 50%, transparent), transparent 70%)',
            }}
            animate={{ opacity: [0.25, 0.5, 0.3], scale: [1, 1.08, 1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
          {EMBER_OFFSETS.map((ember, i) => (
            <span
              key={i}
              className="fartmax-ember bottom-[38%]"
              style={{
                left: ember.left,
                animationDelay: `${ember.delay}s`,
                animationDuration: `${2.2 + (i % 3) * 0.5}s`,
              }}
            />
          ))}
        </>
      ) : null}

      <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,var(--color-alert-red),transparent)] opacity-50" />
    </div>
  );
};
