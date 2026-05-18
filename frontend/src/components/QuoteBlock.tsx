'use client';

import { motion } from 'framer-motion';
import type { FC } from 'react';
import { CopyButton } from '@/components/CopyButton';
import { Seal } from '@/components/Seal';
import { PRESS_QUOTES, serializeQuote, type PressQuote } from '@/lib/press';

interface QuoteBlockProps {
  onQuoteCopied: (q: PressQuote) => void;
}

const EASE = [0.22, 0.61, 0.36, 1] as const;

/**
 * Three boilerplate institutional quotes, each in its own card.
 *
 * Each card carries:
 *   - a small "STATEMENT · §x.y" section header
 *   - a Bureau seal at small size, anchoring the card as an issued
 *     statement rather than a marketing testimonial
 *   - the quote body, set large and italic for the pull-quote effect
 *   - an attribution line + a per-card Copy button
 *
 * Copy semantics mirror a real press desk: pressing Copy lifts the body
 * + attribution exactly as journalists would paste them ("body" — Name,
 * Role) so the formatting survives the round-trip into a document.
 */
export const QuoteBlock: FC<QuoteBlockProps> = ({ onQuoteCopied }) => (
  <motion.section
    id="quotes"
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.55, ease: EASE }}
    className="mx-auto w-full max-w-7xl px-6 lg:px-10"
  >
    <header className="mb-6 flex flex-wrap items-center gap-3 font-mono text-[0.65rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
      <span aria-hidden="true" className="brand-rule h-px w-8 opacity-90" />
      <span className="rounded-sm border border-[var(--border-brass)] px-1.5 py-px text-[0.6rem]">
        §II
      </span>
      <span>BOILERPLATE STATEMENTS · OFFICIAL ATTRIBUTION</span>
      <span aria-hidden="true" className="brand-rule h-px flex-1 opacity-40" />
    </header>

    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {PRESS_QUOTES.map((q, i) => (
        <motion.figure
          key={q.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE, delay: 0.05 * i }}
          className={[
            'group/quote relative flex flex-col gap-5 rounded-md border border-[var(--border-stark)] bg-[var(--bg-panel)] p-6',
            'shadow-[0_20px_50px_-30px_color-mix(in_oklab,black_60%,transparent)]',
          ].join(' ')}
        >
          <header className="flex items-start justify-between">
            <div className="flex items-center gap-2 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
              <span aria-hidden="true" className="brand-rule h-px w-5 opacity-90" />
              STATEMENT · {String(i + 1).padStart(2, '0')}
            </div>
            <div className="text-[var(--accent-brass)]">
              <Seal size={40} className="opacity-85" />
            </div>
          </header>

          <blockquote className="font-display italic text-[1.05rem] leading-snug text-[var(--text-strong)] sm:text-[1.15rem]">
            {`\u201C${q.body}\u201D`}
          </blockquote>

          <figcaption className="mt-auto border-t border-dashed border-[var(--border-subtle)] pt-4">
            <div className="font-display text-base leading-tight tracking-tight text-[var(--text-strong)]">
              {q.attribution}
            </div>
            <div className="mt-1 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
              {q.role}
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
                COPY-READY · ATTRIBUTION INCLUDED
              </span>
              <CopyButton text={serializeQuote(q)} onCopy={() => onQuoteCopied(q)}>
                COPY QUOTE
              </CopyButton>
            </div>
          </figcaption>
        </motion.figure>
      ))}
    </div>
  </motion.section>
);
