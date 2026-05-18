'use client';

import { motion } from 'framer-motion';
import { useCallback, type FC } from 'react';
import { Chip } from '@/components/Chip';
import { Seal } from '@/components/Seal';
import type { WrappedBadge, WrappedBadgeTone } from '@/lib/fart-wrapped';

interface BadgeCabinetProps {
  badges: readonly WrappedBadge[];
  onInteract: (badge: WrappedBadge, kind: 'click' | 'hover') => void;
}

const EASE = [0.22, 0.61, 0.36, 1] as const;

/**
 * §III — Honours cabinet.
 *
 * Four ceremonial distinction cards laid out as a single "cabinet" with
 * a `gap-px` shared border, so the row reads as one issued plaque rather
 * than four marketing tiles. Each card carries:
 *
 *   - Eyebrow code + brass rule
 *   - Tone-coloured seal anchored in the top right
 *   - Big display title + ribbon
 *   - One-line rationale
 *   - Rarity microcopy in mono at the bottom
 *
 * Tone drives the seal accent: brass / amber / cerulean / green map onto
 * the existing alert palette so the cabinet stays inside the brand
 * colour system.
 */
export const BadgeCabinet: FC<BadgeCabinetProps> = ({ badges, onInteract }) => {
  const handleHover = useCallback(
    (b: WrappedBadge) => () => onInteract(b, 'hover'),
    [onInteract],
  );
  const handleClick = useCallback(
    (b: WrappedBadge) => () => onInteract(b, 'click'),
    [onInteract],
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: EASE }}
      className="mx-auto w-full max-w-7xl px-6 lg:px-10"
    >
      <header className="mb-6 flex flex-wrap items-center gap-3 font-mono text-[0.65rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
        <span aria-hidden="true" className="brand-rule h-px w-8 opacity-90" />
        <span className="rounded-sm border border-[var(--border-brass)] px-1.5 py-px text-[0.6rem]">
          §III
        </span>
        <span>HONOURS CABINET · DISTINCTIONS ISSUED</span>
        <span aria-hidden="true" className="brand-rule h-px flex-1 opacity-40" />
      </header>

      <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-[var(--border-stark)] bg-[var(--border-subtle)] sm:grid-cols-2 lg:grid-cols-4">
        {badges.map((badge) => (
          <li key={badge.id}>
            <button
              type="button"
              onClick={handleClick(badge)}
              onPointerEnter={handleHover(badge)}
              onFocus={handleHover(badge)}
              className={[
                'group/badge flex h-full w-full flex-col gap-4 bg-[var(--bg-panel)] p-6 text-left',
                'transition-colors hover:bg-[color-mix(in_oklab,var(--accent-brass)_5%,transparent)]',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-brass)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]',
              ].join(' ')}
            >
              <header className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
                  <span aria-hidden="true" className="brand-rule h-px w-5 opacity-90" />
                  <span>{badge.code}</span>
                </div>
                <span className={toneToSealColor(badge.tone)}>
                  <Seal size={48} className="opacity-95" />
                </span>
              </header>

              <h3 className="font-display text-[1.1rem] leading-tight tracking-tight text-[var(--text-strong)] sm:text-[1.2rem]">
                {badge.title}
              </h3>

              <Chip tone={badgeChipTone(badge.tone)}>{badge.ribbon}</Chip>

              <p className="text-[0.88rem] leading-snug text-[var(--text-default)]">{badge.body}</p>

              <footer className="mt-auto border-t border-dashed border-[var(--border-subtle)] pt-3 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
                RARITY · {badge.rarity}
              </footer>
            </button>
          </li>
        ))}
      </ul>
    </motion.section>
  );
};

function toneToSealColor(tone: WrappedBadgeTone): string {
  switch (tone) {
    case 'brass':
      return 'text-[var(--accent-brass)]';
    case 'amber':
      return 'text-[var(--color-alert-amber)]';
    case 'cerulean':
      return 'text-[var(--color-alert-cerulean)]';
    case 'green':
      return 'text-[var(--color-alert-green)]';
  }
}

function badgeChipTone(tone: WrappedBadgeTone): 'brass' | 'amber' | 'cerulean' | 'green' {
  return tone;
}
