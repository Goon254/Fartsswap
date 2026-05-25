'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { type FC, useState } from 'react';
import {
  hapticLethal,
  hapticVoteDown,
  hapticVoteUp,
} from '@/lib/fartmaximizer-haptics';

type VoteKind = 'up' | 'down';

interface FartmaximizerVoteButtonProps {
  kind: VoteKind;
  onVote: () => void;
  lethalContext?: boolean;
  compact?: boolean;
  active?: boolean;
  disabled?: boolean;
}

export const FartmaximizerVoteButton: FC<FartmaximizerVoteButtonProps> = ({
  kind,
  onVote,
  lethalContext = false,
  compact = false,
  active = false,
  disabled = false,
}) => {
  const reduceMotion = useReducedMotion();
  const [ripple, setRipple] = useState(0);
  const isUp = kind === 'up';

  const handleClick = () => {
    if (isUp) {
      if (lethalContext) hapticLethal();
      else hapticVoteUp();
    } else {
      hapticVoteDown();
    }
    setRipple((n) => n + 1);
    onVote();
  };

  const base =
    'relative overflow-hidden rounded-sm border font-mono font-semibold select-none ' +
    (compact ? 'px-2.5 py-2 text-[0.75rem]' : 'px-3 py-2.5 text-[0.8rem]');

  const colors = isUp
    ? [
        active
          ? 'border-[color-mix(in_oklab,var(--color-alert-green)_70%,transparent)] bg-[color-mix(in_oklab,var(--color-alert-green)_28%,var(--bg-panel))]'
          : 'border-[color-mix(in_oklab,var(--color-alert-green)_35%,transparent)] bg-[color-mix(in_oklab,var(--color-alert-green)_12%,var(--bg-panel))]',
        'text-[var(--color-alert-green)]',
        'shadow-[0_0_16px_color-mix(in_oklab,var(--color-alert-green)_15%,transparent)]',
        'hover:border-[color-mix(in_oklab,var(--color-alert-green)_55%,transparent)]',
        'hover:bg-[color-mix(in_oklab,var(--color-alert-green)_20%,var(--bg-panel))]',
      ].join(' ')
    : [
        active
          ? 'border-[color-mix(in_oklab,var(--color-alert-red)_70%,transparent)] bg-[color-mix(in_oklab,var(--color-alert-red)_24%,var(--bg-panel))]'
          : 'border-[color-mix(in_oklab,var(--color-alert-red)_35%,transparent)] bg-[color-mix(in_oklab,var(--color-alert-red)_10%,var(--bg-panel))]',
        'text-[var(--color-alert-red)]',
        'shadow-[0_0_12px_color-mix(in_oklab,var(--color-alert-red)_12%,transparent)]',
        'hover:border-[color-mix(in_oklab,var(--color-alert-red)_55%,transparent)]',
        'hover:bg-[color-mix(in_oklab,var(--color-alert-red)_18%,var(--bg-panel))]',
      ].join(' ');

  return (
    <motion.button
      type="button"
      aria-label={isUp ? 'Upvote' : 'Downvote'}
      aria-pressed={active}
      disabled={disabled}
      onClick={handleClick}
      className={`${base} ${colors} disabled:cursor-not-allowed disabled:opacity-45`}
      whileHover={reduceMotion ? undefined : { scale: 1.06, y: -1 }}
      whileTap={reduceMotion ? undefined : { scale: 0.88, y: 2 }}
      transition={{ type: 'spring', stiffness: 520, damping: 28 }}
    >
      {!reduceMotion && ripple > 0 ? (
        <motion.span
          key={ripple}
          className={`pointer-events-none absolute inset-0 ${
            isUp ? 'bg-[var(--color-alert-green)]' : 'bg-[var(--color-alert-red)]'
          }`}
          initial={{ opacity: 0.35, scale: 0 }}
          animate={{ opacity: 0, scale: 2.2 }}
          transition={{ duration: 0.45 }}
        />
      ) : null}
      <span className="relative z-10">{isUp ? '▲' : '▼'}</span>
    </motion.button>
  );
};
