'use client';

import { motion } from 'framer-motion';
import type { FC } from 'react';
import { Chip } from '@/components/Chip';

interface PressStripProps {
  /** Fires when the press-embargo CTA is clicked. */
  onPressCtaClick?: () => void;
}

const EASE = [0.22, 0.61, 0.36, 1] as const;

/**
 * Press / legitimacy strip.
 *
 * Composes:
 *   - Two pull-quote tiles in the Bureau voice ("No medical value…")
 *   - A press-embargo CTA tile linking to the (placeholder) packet
 *
 * Tone is deadpan press-room: no exclamation marks, no marketing
 * hyperbole, just a row of institutional one-liners with a contact
 * affordance for journalists at the right edge.
 */
export const PressStrip: FC<PressStripProps> = ({ onPressCtaClick }) => (
  <motion.section
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: EASE }}
    className="mx-auto w-full max-w-7xl px-6 lg:px-10"
  >
    <header className="mb-6 flex flex-wrap items-center gap-3 font-mono text-[0.65rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
      <span aria-hidden="true" className="brand-rule h-px w-8 opacity-90" />
      <span className="rounded-sm border border-[var(--border-brass)] px-1.5 py-px text-[0.6rem]">
        §VI
      </span>
      <span>PRESS & DIPLOMATIC CORRESPONDENCE</span>
      <span aria-hidden="true" className="brand-rule h-px flex-1 opacity-40" />
    </header>

    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-[var(--border-subtle)] bg-[var(--border-subtle)] md:grid-cols-3">
      {QUOTES.map((q) => (
        <blockquote
          key={q.code}
          className="flex flex-col gap-3 bg-[var(--bg-panel)] p-6"
        >
          <div className="flex items-center gap-2 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
            <span aria-hidden="true" className="brand-rule h-px w-5 opacity-90" />
            <span>{q.code}</span>
          </div>
          <p className="font-display text-[1.15rem] italic leading-snug text-[var(--text-strong)] sm:text-[1.3rem]">
            {`\u201C${q.line}\u201D`}
          </p>
          <div className="mt-auto font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
            {q.attribution}
          </div>
        </blockquote>
      ))}

      <button
        type="button"
        onClick={onPressCtaClick}
        className={[
          'group/press flex flex-col gap-3 bg-[color-mix(in_oklab,var(--accent-brass)_6%,transparent)] p-6 text-left',
          'transition-colors hover:bg-[color-mix(in_oklab,var(--accent-brass)_12%,transparent)]',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-brass)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)]',
        ].join(' ')}
      >
        <div className="flex items-center gap-2 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
          <span aria-hidden="true" className="brand-rule h-px w-5 opacity-90" />
          <span>EMBARGO PACKET</span>
        </div>
        <div className="font-display text-[1.25rem] leading-snug tracking-tight text-[var(--text-strong)] sm:text-[1.45rem]">
          Press embargo packet available upon request.
        </div>
        <p className="text-[0.85rem] leading-snug text-[var(--text-default)]">
          Includes the official seal, sample artifacts, biographical notes on the Bureau, and a
          dispatch contact for accredited correspondents.
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-2">
          <Chip tone="brass">EMBARGO · ACTIVE</Chip>
          <Chip tone="neutral">DESK · §9.1</Chip>
        </div>
        <span className="mt-2 inline-flex items-center gap-2 font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--accent-brass)] group-hover/press:text-[var(--text-strong)]">
          REQUEST PACKET
          <Arrow />
        </span>
      </button>
    </div>
  </motion.section>
);

const QUOTES = [
  {
    code: 'STATEMENT · I',
    line: 'No medical value. Immense cultural value.',
    attribution: 'BUREAU OF ACOUSTIC GASOLOGY · §0.1',
  },
  {
    code: 'STATEMENT · II',
    line: 'Recognised nowhere, respected everywhere.',
    attribution: 'OFFICE OF ARTIFACT ISSUANCE · §6.3',
  },
] as const;

const Arrow: FC = () => (
  <svg width="12" height="12" viewBox="0 0 14 14" aria-hidden="true">
    <path
      d="M1 7h11M8 3l4 4-4 4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
      fill="none"
    />
  </svg>
);
