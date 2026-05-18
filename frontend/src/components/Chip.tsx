import type { FC, ReactNode } from 'react';

type ChipTone = 'neutral' | 'teal' | 'brass' | 'amber' | 'red' | 'green' | 'cerulean';

const TONES: Record<ChipTone, { ring: string; fg: string; bg: string; dot: string }> = {
  neutral: {
    ring: 'ring-[var(--border-stark)]',
    fg: 'text-[var(--text-default)]',
    bg: 'bg-[var(--bg-panel-strong)]',
    dot: 'bg-[var(--text-muted)]',
  },
  teal: {
    ring: 'ring-[var(--border-teal)]',
    fg: 'text-[var(--accent-teal)]',
    bg: 'bg-[color-mix(in_oklab,var(--accent-teal)_8%,transparent)]',
    dot: 'bg-[var(--accent-teal)]',
  },
  brass: {
    ring: 'ring-[var(--border-brass)]',
    fg: 'text-[var(--accent-brass)]',
    bg: 'bg-[color-mix(in_oklab,var(--accent-brass)_10%,transparent)]',
    dot: 'bg-[var(--accent-brass)]',
  },
  amber: {
    ring: 'ring-[color-mix(in_oklab,var(--color-alert-amber)_45%,transparent)]',
    fg: 'text-[var(--color-alert-amber)]',
    bg: 'bg-[color-mix(in_oklab,var(--color-alert-amber)_10%,transparent)]',
    dot: 'bg-[var(--color-alert-amber)]',
  },
  red: {
    ring: 'ring-[color-mix(in_oklab,var(--color-alert-red)_45%,transparent)]',
    fg: 'text-[var(--color-alert-red)]',
    bg: 'bg-[color-mix(in_oklab,var(--color-alert-red)_10%,transparent)]',
    dot: 'bg-[var(--color-alert-red)]',
  },
  green: {
    ring: 'ring-[color-mix(in_oklab,var(--color-alert-green)_45%,transparent)]',
    fg: 'text-[var(--color-alert-green)]',
    bg: 'bg-[color-mix(in_oklab,var(--color-alert-green)_10%,transparent)]',
    dot: 'bg-[var(--color-alert-green)]',
  },
  cerulean: {
    ring: 'ring-[color-mix(in_oklab,var(--color-alert-cerulean)_45%,transparent)]',
    fg: 'text-[var(--color-alert-cerulean)]',
    bg: 'bg-[color-mix(in_oklab,var(--color-alert-cerulean)_10%,transparent)]',
    dot: 'bg-[var(--color-alert-cerulean)]',
  },
};

interface ChipProps {
  tone?: ChipTone;
  children: ReactNode;
  withDot?: boolean;
  className?: string;
}

/**
 * Status chip used for classification labels, theme codes, threat levels.
 * Tone maps onto the brand alert colours; `withDot` adds a small breathing
 * indicator suitable for things like "OPERATIONAL".
 */
export const Chip: FC<ChipProps> = ({ tone = 'neutral', children, withDot = false, className }) => {
  const t = TONES[tone];
  return (
    <span
      className={[
        'inline-flex items-center gap-2 rounded-sm px-2 py-[0.3rem]',
        'font-mono text-[0.62rem] uppercase tracking-wide-3',
        'ring-1 ring-inset',
        t.ring,
        t.bg,
        t.fg,
        className ?? '',
      ].join(' ')}
    >
      {withDot ? (
        <span
          aria-hidden="true"
          className={`relative inline-block h-1.5 w-1.5 rounded-full ${t.dot}`}
        >
          <span className={`absolute inset-0 rounded-full ${t.dot} animate-ping opacity-40`} />
        </span>
      ) : null}
      {children}
    </span>
  );
};
