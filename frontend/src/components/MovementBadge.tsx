import type { FC } from 'react';
import { movementLabel, movementTone, type Movement } from '@/lib/methane-index';

interface MovementBadgeProps {
  movement: Movement;
  /** Display delta like "+12.4%" or "±9.2%". */
  delta: string;
  /** Compact variant for table rows. */
  compact?: boolean;
}

/**
 * Index-style movement indicator.
 *
 * A tone-coloured pill with an arrow glyph + delta + label, reading as a
 * market-bulletin marker rather than a chart annotation. The arrow flips
 * with `movement` and the entire chip is coloured against `--color-alert-*`
 * so green/red signals stay consistent with the rest of the dossier system.
 */
export const MovementBadge: FC<MovementBadgeProps> = ({ movement, delta, compact = false }) => {
  const tone = movementTone(movement);
  const label = movementLabel(movement);
  const toneClasses = TONE_CLASSES[tone];
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-sm border font-mono uppercase tracking-wide-3',
        compact ? 'px-2 py-0.5 text-[0.55rem]' : 'px-2.5 py-1 text-[0.6rem]',
        toneClasses,
      ].join(' ')}
    >
      <ArrowGlyph movement={movement} />
      <span className="tabular-nums">{delta}</span>
      {compact ? null : <span aria-hidden="true" className="h-2.5 w-px bg-current opacity-30" />}
      {compact ? null : <span>{label}</span>}
    </span>
  );
};

const TONE_CLASSES: Record<ReturnType<typeof movementTone>, string> = {
  green:
    'border-[color-mix(in_oklab,var(--color-alert-green)_45%,transparent)] bg-[color-mix(in_oklab,var(--color-alert-green)_10%,transparent)] text-[var(--color-alert-green)]',
  red: 'border-[color-mix(in_oklab,var(--color-alert-red)_45%,transparent)] bg-[color-mix(in_oklab,var(--color-alert-red)_10%,transparent)] text-[var(--color-alert-red)]',
  amber:
    'border-[color-mix(in_oklab,var(--color-alert-amber)_45%,transparent)] bg-[color-mix(in_oklab,var(--color-alert-amber)_10%,transparent)] text-[var(--color-alert-amber)]',
  brass: 'border-[var(--border-brass)] bg-[color-mix(in_oklab,var(--accent-brass)_10%,transparent)] text-[var(--accent-brass)]',
  neutral: 'border-[var(--border-stark)] bg-[var(--bg-panel-strong)] text-[var(--text-muted)]',
};

const ArrowGlyph: FC<{ movement: Movement }> = ({ movement }) => {
  switch (movement) {
    case 'up':
      return (
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          <path d="M5 1 L9 6 L6 6 L6 9 L4 9 L4 6 L1 6 Z" fill="currentColor" />
        </svg>
      );
    case 'down':
      return (
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          <path d="M5 9 L1 4 L4 4 L4 1 L6 1 L6 4 L9 4 Z" fill="currentColor" />
        </svg>
      );
    case 'flat':
      return (
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          <path d="M1 4 H9 V6 H1 Z" fill="currentColor" />
        </svg>
      );
    case 'volatile':
      return (
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          <path d="M1 8 L3 4 L5 7 L7 2 L9 6" stroke="currentColor" strokeWidth="1.4" fill="none" />
        </svg>
      );
    case 'new':
      return (
        <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
          <path d="M5 1 L6 4 L9 4 L6.6 6 L7.6 9 L5 7.2 L2.4 9 L3.4 6 L1 4 L4 4 Z" fill="currentColor" />
        </svg>
      );
  }
};
