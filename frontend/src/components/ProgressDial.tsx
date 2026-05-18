'use client';

import type { FC, ReactNode } from 'react';

interface ProgressDialProps {
  /** 0..1 — the proportion of the ring that should be filled. */
  progress: number;
  /** Diameter in pixels. */
  size?: number;
  /** Centered content (status badge, large icon, etc.). */
  children?: ReactNode;
  /** Add an inner pulse halo when armed/recording. */
  pulsing?: boolean;
  className?: string;
}

/**
 * Concentric-ring progress dial.
 *
 * Built as a single SVG so the ring, tick marks, and brass progress arc all
 * share crisp vector edges and scale with `size`. The progress arc uses
 * `stroke-dasharray` + `stroke-dashoffset` (no JS animation needed) so it
 * stays cheap; callers drive `progress` from their own state.
 *
 * The numeric value is hidden from screen readers (decorative ring); the
 * caller is responsible for an aria-live region with the status text.
 */
export const ProgressDial: FC<ProgressDialProps> = ({
  progress,
  size = 320,
  children,
  pulsing = false,
  className,
}) => {
  const clamped = Math.min(1, Math.max(0, progress));
  const stroke = 2;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - clamped);

  return (
    <div
      className={['relative inline-flex items-center justify-center', className ?? ''].join(' ')}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
        {/* outer subtle ring */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          stroke="var(--border-subtle)"
          strokeWidth={stroke}
          fill="none"
        />
        {/* inner double-ring */}
        <circle
          cx={cx}
          cy={cy}
          r={r - 14}
          stroke="var(--border-subtle)"
          strokeWidth={1}
          fill="none"
          opacity={0.6}
        />
        {/* tick marks — every 6° = 60 ticks (matches 10-second capture) */}
        {Array.from({ length: 60 }).map((_, i) => {
          const angle = (i * 360) / 60 - 90;
          const inner = r - 6;
          const outer = i % 5 === 0 ? r - 1 : r - 3;
          const x1 = cx + inner * Math.cos((angle * Math.PI) / 180);
          const y1 = cy + inner * Math.sin((angle * Math.PI) / 180);
          const x2 = cx + outer * Math.cos((angle * Math.PI) / 180);
          const y2 = cy + outer * Math.sin((angle * Math.PI) / 180);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={i % 5 === 0 ? 'var(--accent-brass)' : 'var(--text-faint)'}
              strokeWidth={i % 5 === 0 ? 1 : 0.6}
              opacity={i % 5 === 0 ? 0.7 : 0.45}
            />
          );
        })}
        {/* progress arc — brass, drawn clockwise from 12 o'clock */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          stroke="var(--accent-brass)"
          strokeWidth={stroke + 1}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dashoffset 220ms linear' }}
        />
      </svg>

      {/* breathing halo for ARMED/RECORDING state */}
      {pulsing ? (
        <span
          className={[
            'absolute inset-6 rounded-full',
            'bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--accent-teal)_22%,transparent),transparent_70%)]',
            'animate-brand-pulse',
          ].join(' ')}
        />
      ) : null}

      <div className="relative flex h-full w-full items-center justify-center">{children}</div>
    </div>
  );
};
