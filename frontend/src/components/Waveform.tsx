'use client';

import { motion } from 'framer-motion';
import { useMemo, type FC } from 'react';

interface WaveformProps {
  bars?: number;
  className?: string;
  seed?: number;
}

/**
 * Static-but-living waveform.
 *
 * We pre-compute a deterministic bar-height array (so SSR + client agree)
 * and then animate just the alpha + a 1px Y-offset per bar with a staggered
 * delay. Result feels like a meter that's already received its sample —
 * not a "I am loading" spinner.
 */
export const Waveform: FC<WaveformProps> = ({ bars = 56, className, seed = 42 }) => {
  const heights = useMemo(() => generateBars(bars, seed), [bars, seed]);

  return (
    <div
      className={[
        'relative flex h-24 items-end gap-[3px] overflow-hidden',
        'rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-panel-strong)] px-3 py-2',
        className ?? '',
      ].join(' ')}
      aria-label="Captured acoustic sample"
    >
      {heights.map((h, i) => (
        <motion.span
          key={i}
          className="block w-[3px] origin-bottom rounded-[1px] bg-[var(--accent-teal)]"
          style={{ height: `${h}%` }}
          initial={{ opacity: 0.25, y: 4 }}
          animate={{ opacity: [0.35, 0.95, 0.35], y: [4, 0, 4] }}
          transition={{
            duration: 2.8,
            delay: (i % 16) * 0.05,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
      <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-[var(--accent-brass)] opacity-25" />
      <div className="pointer-events-none absolute bottom-1 left-3 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
        SAMPLE · 02.41s · 44.1 kHz
      </div>
    </div>
  );
};

/**
 * Tiny deterministic PRNG so bar heights are stable between SSR and CSR.
 * (Math.random would produce hydration mismatches.)
 */
function generateBars(count: number, seed: number): number[] {
  let s = seed;
  const heights: number[] = [];
  for (let i = 0; i < count; i++) {
    s = (s * 9301 + 49297) % 233280;
    const r = s / 233280;
    const env = Math.sin((i / count) * Math.PI) * 0.7 + 0.3;
    heights.push(Math.round((12 + r * 75) * env));
  }
  return heights;
}
