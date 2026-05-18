'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef, type FC } from 'react';
import type { BureauCommentaryLine } from '@/lib/methane-index';

interface BureauCommentaryProps {
  lines: readonly BureauCommentaryLine[];
  /** Fires once when the block is rendered, for analytics. */
  onMounted: (lineCount: number) => void;
}

const EASE = [0.22, 0.61, 0.36, 1] as const;

/**
 * Editorial commentary block ("market commentary, bureau notes").
 *
 * Single bordered article with the four editorial lines laid out as
 * §I…§IV sub-entries. Each entry carries an eyebrow, the body in
 * Fraunces (serif) so it reads as wire-service editorial, and the
 * named-attribution line below.
 *
 * Fires `commentary_section_viewed` once on mount with the visible
 * line count, so we can pivot on it later (which weeks the commentary
 * actually landed for readers).
 */
export const BureauCommentary: FC<BureauCommentaryProps> = ({ lines, onMounted }) => {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    onMounted(lines.length);
  }, [lines.length, onMounted]);

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
          §IV
        </span>
        <span>BUREAU COMMENTARY · MARKET NOTES</span>
        <span aria-hidden="true" className="brand-rule h-px flex-1 opacity-40" />
      </header>

      <article
        className={[
          'relative overflow-hidden rounded-md border border-[var(--border-stark)]',
          'bg-[color-mix(in_oklab,var(--bg-panel)_85%,transparent)] p-7 sm:p-9',
          'shadow-[0_30px_70px_-40px_color-mix(in_oklab,black_70%,transparent)]',
        ].join(' ')}
      >
        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-x-10">
          {lines.map((line) => (
            <li key={line.id} className="flex flex-col gap-3">
              <div className="flex items-center gap-2 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
                <span aria-hidden="true" className="brand-rule h-px w-5 opacity-90" />
                <span>{line.eyebrow ?? 'EDITORIAL'}</span>
              </div>
              <p className="font-display text-[1.05rem] leading-relaxed text-[var(--text-default)]">
                {line.body}
              </p>
              <footer className="mt-auto border-t border-dashed border-[var(--border-subtle)] pt-3">
                <div className="font-display text-[0.95rem] leading-tight tracking-tight text-[var(--text-strong)]">
                  {line.attribution}
                </div>
              </footer>
            </li>
          ))}
        </ul>
      </article>
    </motion.section>
  );
};
