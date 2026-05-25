'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { FC, ReactNode } from 'react';

const PODIUM_EMBERS = [
  { left: '8%', delay: 0.1 },
  { left: '22%', delay: 0.55 },
  { left: '78%', delay: 0.25 },
  { left: '92%', delay: 0.8 },
  { left: '50%', delay: 0.35 },
] as const;

interface LethalAuraProps {
  active: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Fire ring + embers + breathing glow for rank #1 podium card.
 */
export const LethalAura: FC<LethalAuraProps> = ({ active, children, className = '' }) => {
  const reduceMotion = useReducedMotion();

  if (!active) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={`relative ${className}`}>
      {!reduceMotion ? (
        <>
          <div className="fartmax-lethal-glow absolute -inset-3 -z-10 rounded-lg sm:-inset-5" />
          <div className="fartmax-fire-ring absolute -inset-[2px] -z-[1] rounded-md" />
          {PODIUM_EMBERS.map((e, i) => (
            <span
              key={i}
              className="fartmax-ember bottom-4"
              style={{
                left: e.left,
                animationDelay: `${e.delay}s`,
                animationDuration: `${1.8 + i * 0.35}s`,
              }}
            />
          ))}
          <motion.div
            className="pointer-events-none absolute -top-3 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-sm border border-[color-mix(in_oklab,var(--color-alert-red)_60%,transparent)] bg-[color-mix(in_oklab,var(--color-alert-red)_22%,var(--bg-base))] px-3 py-1 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--color-alert-red)] shadow-[0_0_24px_color-mix(in_oklab,var(--color-alert-red)_40%,transparent)]"
            animate={{ y: [0, -3, 0], opacity: [0.85, 1, 0.85] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            ☣ Maximum lethality
          </motion.div>
        </>
      ) : (
        <div
          aria-hidden="true"
          className="absolute -inset-[2px] -z-[1] rounded-md ring-2 ring-[var(--color-alert-red)]"
        />
      )}
      <div className={reduceMotion ? '' : 'fartmax-podium-float relative z-10'}>{children}</div>
    </div>
  );
};
