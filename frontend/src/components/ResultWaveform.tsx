'use client';

import { motion } from 'framer-motion';
import { useMemo, type FC } from 'react';

interface ResultWaveformProps {
  seed: number;
  /** ms, used for the ruler readout. */
  durationMs: number;
  className?: string;
}

/**
 * Larger, ceremonial waveform for the result hero.
 *
 * Differences from the lightweight `<Waveform />` used on the landing card:
 *   - Taller bars with a centered baseline (looks like a real oscilloscope
 *     readout rather than a UI meter).
 *   - Brass tick marks underneath at 25/50/75/100% — a "ruler" feel.
 *   - Peak indicator dots above the tallest bars.
 *   - Animation reveals left-to-right via a clip-path mask so it reads as
 *     "playing back" rather than fading in place.
 */
export const ResultWaveform: FC<ResultWaveformProps> = ({ seed, durationMs, className }) => {
  const bars = 96;
  const heights = useMemo(() => generateBars(bars, seed), [seed]);
  const peaks = useMemo(() => detectPeaks(heights), [heights]);
  const sec = (durationMs / 1000).toFixed(2);

  return (
    <div
      className={[
        'relative isolate overflow-hidden rounded-md',
        'border border-[var(--border-subtle)] bg-[var(--bg-panel-strong)]',
        'px-4 pb-3 pt-5 sm:px-5',
        className ?? '',
      ].join(' ')}
      aria-label={`Captured acoustic sample (${sec}s)`}
    >
      {/* baseline rule */}
      <span
        aria-hidden="true"
        className="absolute inset-x-4 top-1/2 z-0 h-px -translate-y-px bg-[var(--accent-brass)] opacity-30 sm:inset-x-5"
      />

      {/* peak markers */}
      <div className="relative z-10 -mb-1 flex h-3 items-end gap-[3px]">
        {peaks.map((isPeak, i) => (
          <span key={`peak-${i}`} className="block w-[3px]">
            {isPeak ? (
              <span className="mx-auto block h-1.5 w-1.5 rounded-full bg-[var(--accent-brass)] opacity-90" />
            ) : null}
          </span>
        ))}
      </div>

      {/* bars — symmetric top/bottom for oscilloscope feel */}
      <motion.div
        initial={{ clipPath: 'inset(0 100% 0 0)' }}
        animate={{ clipPath: 'inset(0 0% 0 0)' }}
        transition={{ duration: 1.1, ease: [0.22, 0.61, 0.36, 1] }}
        className="relative z-10 flex h-24 items-center gap-[3px]"
      >
        {heights.map((h, i) => (
          <span key={i} className="flex h-full w-[3px] flex-col items-center justify-center">
            <span
              className="block w-full rounded-[1px] bg-[var(--accent-teal)] opacity-90"
              style={{ height: `${h / 2}%` }}
            />
            <span
              className="block w-full rounded-[1px] bg-[var(--accent-teal)] opacity-50"
              style={{ height: `${h / 2.4}%` }}
            />
          </span>
        ))}
      </motion.div>

      {/* ruler */}
      <div className="relative z-10 mt-2 flex items-center justify-between font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
        <span>00.00s</span>
        <span aria-hidden="true" className="h-2 w-px bg-[var(--border-stark)]" />
        <span>{(Number(sec) * 0.5).toFixed(2)}s</span>
        <span aria-hidden="true" className="h-2 w-px bg-[var(--border-stark)]" />
        <span className="text-[var(--accent-brass)]">{sec}s</span>
      </div>

      {/* corner field code */}
      <span className="absolute right-3 top-2 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
        AGD-401 · MONO · 44.1 kHz
      </span>
    </div>
  );
};

/**
 * Deterministic PRNG so SSR + CSR agree.
 */
function generateBars(count: number, seed: number): number[] {
  let s = seed >>> 0 || 1;
  const heights: number[] = [];
  for (let i = 0; i < count; i++) {
    s = (s * 9301 + 49297) % 233280;
    const r = s / 233280;
    // Two-lobe envelope so each waveform has a distinct silhouette per seed.
    const envA = Math.sin((i / count) * Math.PI) * 0.65;
    const envB = Math.sin((i / count) * Math.PI * 3) * 0.35;
    const env = Math.max(0.15, envA + envB);
    heights.push(Math.round((25 + r * 70) * env));
  }
  return heights;
}

/** Mark the local maxima above 75% as "peaks" for the brass dots above. */
function detectPeaks(heights: number[]): boolean[] {
  return heights.map((h, i) => {
    if (h < 55) return false;
    const prev = heights[i - 1] ?? 0;
    const next = heights[i + 1] ?? 0;
    return h >= prev && h >= next;
  });
}
