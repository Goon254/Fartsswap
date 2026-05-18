'use client';

import { motion } from 'framer-motion';
import { useCallback, type FC } from 'react';
import { Chip } from '@/components/Chip';
import type { ArchivalNote, RitualTeaserItem } from '@/lib/methane-index';

interface RitualTeaserProps {
  rituals: readonly RitualTeaserItem[];
  notes: readonly ArchivalNote[];
  onInteract: (ritualId: string, kind: 'click' | 'hover') => void;
}

const EASE = [0.22, 0.61, 0.36, 1] as const;

/**
 * Closing ritual teaser block.
 *
 * Two-column composition:
 *   - Left: three ritual cards (Fart Wrapped · All-Time Archive · Methane
 *     Almanac) framed as forthcoming Bureau rituals rather than features.
 *     Each card surfaces a status microcopy and is marked as unavailable
 *     ("Compiles · Week 52 MMXXVI", etc.) until release infrastructure
 *     ships.
 *   - Right: a small archival-notes ledger summarising year-to-date /
 *     quarter facts ("Top classification — Cerulean Event · 7 weekly
 *     wins"). Operates as a closing ledger entry for the issue.
 *
 * Analytics: `ritual_teaser_interacted` fires on hover and click; the
 * parent decides whether to dedupe.
 */
export const RitualTeaser: FC<RitualTeaserProps> = ({ rituals, notes, onInteract }) => {
  const handleHover = useCallback(
    (id: string) => () => onInteract(id, 'hover'),
    [onInteract],
  );
  const handleClick = useCallback(
    (id: string) => () => onInteract(id, 'click'),
    [onInteract],
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: EASE }}
      className="mx-auto w-full max-w-7xl px-6 pb-16 lg:px-10 lg:pb-24"
    >
      <header className="mb-6 flex flex-wrap items-center gap-3 font-mono text-[0.65rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
        <span aria-hidden="true" className="brand-rule h-px w-8 opacity-90" />
        <span className="rounded-sm border border-[var(--border-brass)] px-1.5 py-px text-[0.6rem]">
          §V
        </span>
        <span>FORTHCOMING RITUALS · ARCHIVAL LEDGER</span>
        <span aria-hidden="true" className="brand-rule h-px flex-1 opacity-40" />
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr] lg:gap-10">
        {/* Rituals */}
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {rituals.map((r) => (
            <li key={r.id}>
              <a
                href={r.href ?? '#'}
                onClick={handleClick(r.id)}
                onMouseEnter={handleHover(r.id)}
                onFocus={handleHover(r.id)}
                className={[
                  'group/rt flex h-full flex-col gap-3 rounded-md border border-[var(--border-stark)] bg-[var(--bg-panel)] p-5',
                  'shadow-[0_20px_50px_-30px_color-mix(in_oklab,black_60%,transparent)]',
                  'transition-colors hover:border-[var(--accent-brass)]',
                ].join(' ')}
              >
                <header className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
                    <span aria-hidden="true" className="brand-rule h-px w-5 opacity-90" />
                    {r.code}
                  </div>
                  <Chip tone={r.available ? 'green' : 'amber'} withDot={!r.available}>
                    {r.available ? 'OPEN' : 'PENDING'}
                  </Chip>
                </header>
                <h3 className="font-display text-[1.15rem] leading-tight tracking-tight text-[var(--text-strong)]">
                  {r.title}
                </h3>
                <p className="text-[0.9rem] leading-snug text-[var(--text-default)]">{r.body}</p>
                <footer className="mt-auto border-t border-dashed border-[var(--border-subtle)] pt-3 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
                  {r.hint}
                </footer>
              </a>
            </li>
          ))}
        </ul>

        {/* Archival ledger */}
        <aside className="rounded-md border border-dashed border-[var(--border-brass)] bg-[color-mix(in_oklab,var(--accent-brass)_5%,transparent)] p-6">
          <div className="flex items-center gap-2 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
            <span aria-hidden="true" className="brand-rule h-px w-5 opacity-90" />
            ARCHIVAL NOTES · YTD
          </div>
          <ul className="mt-3 flex flex-col gap-3">
            {notes.map((note) => (
              <li key={note.id}>
                <div className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
                  {note.label}
                </div>
                <div className="mt-0.5 text-[0.95rem] leading-snug text-[var(--text-default)]">
                  {note.value}
                </div>
              </li>
            ))}
          </ul>
          <footer className="mt-5 border-t border-dashed border-[var(--border-brass)] pt-4 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
            ANNUAL REVIEW FORTHCOMING · WEEK 52 · MMXXVI
          </footer>
        </aside>
      </div>
    </motion.section>
  );
};
