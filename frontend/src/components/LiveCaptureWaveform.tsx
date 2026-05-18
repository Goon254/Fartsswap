'use client';

import { motion, type Variants } from 'framer-motion';
import { useMemo, type FC } from 'react';

interface LiveCaptureWaveformProps {
  /** When true, bars animate as if a sample is actively being captured. */
  active: boolean;
  /** When true, bars are frozen at a snapshot pose (capture complete). */
  frozen?: boolean;
  bars?: number;
  className?: string;
}

/**
 * "Listening" waveform for the capture chamber.
 *
 * - STANDBY (active=false, frozen=false): bars sit at a low, even baseline.
 * - RECORDING (active=true): bars breathe with staggered, randomised heights.
 * - CAPTURE COMPLETE (frozen=true): bars hold a deterministic silhouette
 *   that hints at the final waveform we'll send to the analysis step.
 *
 * Everything is deterministic per `bars` so SSR + CSR agree. Motion is
 * achieved via Framer variants — a single repeating animation per bar that
 * Framer manages cheaply.
 */
export const LiveCaptureWaveform: FC<LiveCaptureWaveformProps> = ({
  active,
  frozen = false,
  bars = 56,
  className,
}) => {
  const baseHeights = useMemo(() => generateBars(bars, 9001), [bars]);
  const peakHeights = useMemo(() => generatePeaks(bars), [bars]);
  const restHeights = useMemo(() => bars, [bars]); // ref to silence eslint, value unused

  const variants: Variants = {
    standby: (i: number) => ({
      scaleY: 0.12,
      opacity: 0.4,
      transition: { duration: 0.4 + (i % 5) * 0.05, ease: 'easeOut' },
    }),
    recording: (i: number) => ({
      scaleY: [0.18, baseHeights[i] ?? 0.4, 0.22, peakHeights[i] ?? 0.5, 0.18],
      opacity: [0.55, 1, 0.7, 1, 0.55],
      transition: {
        duration: 1.4 + (i % 7) * 0.05,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: (i % 13) * 0.04,
      },
    }),
    frozen: (i: number) => ({
      scaleY: baseHeights[i] ?? 0.4,
      opacity: 0.95,
      transition: { duration: 0.4, ease: 'easeOut' },
    }),
  };

  const state = frozen ? 'frozen' : active ? 'recording' : 'standby';
  void restHeights;

  return (
    <div
      className={[
        'relative flex h-28 items-center gap-[3px] overflow-hidden',
        'rounded-md border border-[var(--border-subtle)] bg-[var(--bg-panel-strong)] px-4',
        className ?? '',
      ].join(' ')}
      aria-label={
        frozen ? 'Capture complete' : active ? 'Capturing audio sample' : 'Standby'
      }
    >
      {/* centred baseline rule */}
      <span
        aria-hidden="true"
        className="absolute inset-x-4 top-1/2 z-0 h-px -translate-y-px bg-[var(--accent-brass)] opacity-25"
      />
      {Array.from({ length: bars }).map((_, i) => (
        <motion.span
          key={i}
          custom={i}
          variants={variants}
          animate={state}
          style={{ originY: 0.5 }}
          className={[
            'relative z-10 block h-3/4 w-[3px] rounded-[1px]',
            frozen || active ? 'bg-[var(--accent-teal)]' : 'bg-[var(--text-faint)]',
          ].join(' ')}
        />
      ))}
      <span className="absolute bottom-1 left-3 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
        AGD-301 · CAPTURE BUFFER
      </span>
      <span className="absolute bottom-1 right-3 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
        {frozen ? 'BUFFERED' : active ? 'LIVE' : 'STANDBY'}
      </span>
    </div>
  );
};

function generateBars(count: number, seed: number): number[] {
  // Returns scaleY values between ~0.15 and ~1.0, smoothed by a sinusoidal
  // envelope so the silhouette has shape rather than uniform noise.
  let s = seed >>> 0 || 1;
  const heights: number[] = [];
  for (let i = 0; i < count; i++) {
    s = (s * 9301 + 49297) % 233280;
    const r = s / 233280;
    const env = Math.max(0.2, Math.sin((i / count) * Math.PI) * 0.85 + 0.15);
    heights.push(Math.min(1, Math.max(0.15, (0.25 + r * 0.7) * env)));
  }
  return heights;
}

function generatePeaks(count: number): number[] {
  // A second variant array used for the "spike" pose in the recording loop.
  let s = 4242;
  const heights: number[] = [];
  for (let i = 0; i < count; i++) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const r = (s / 0x7fffffff) ** 1.6;
    heights.push(Math.min(1, 0.3 + r));
  }
  return heights;
}
