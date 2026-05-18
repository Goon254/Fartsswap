'use client';

import { motion } from 'framer-motion';
import type { FC } from 'react';
import { Chip } from '@/components/Chip';
import { Seal } from '@/components/Seal';
import { PRESS_DOCKET } from '@/lib/press';

const EASE = [0.22, 0.61, 0.36, 1] as const;

/**
 * Closing boilerplate / "About the Bureau" card.
 *
 * Reads as the boilerplate paragraph at the bottom of a real press
 * release — institutional, dry, slightly self-important. Includes the
 * docket and a "###" sign-off in the corner so it lands as a closing
 * mark on the page rather than a marketing flourish.
 */
export const BoilerplateCard: FC = () => (
  <motion.section
    id="boilerplate"
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.55, ease: EASE }}
    className="mx-auto w-full max-w-7xl px-6 pb-16 lg:px-10 lg:pb-24"
  >
    <article
      className={[
        'relative overflow-hidden rounded-md border border-[var(--border-stark)]',
        'bg-[color-mix(in_oklab,var(--bg-panel)_85%,transparent)] px-7 py-8 sm:px-10 sm:py-10',
        'shadow-[0_30px_70px_-40px_color-mix(in_oklab,black_70%,transparent)]',
      ].join(' ')}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 font-mono text-[0.62rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
            <span aria-hidden="true" className="brand-rule h-px w-8 opacity-90" />
            <span className="rounded-sm border border-[var(--border-brass)] px-1.5 py-px text-[0.6rem]">
              §VI
            </span>
            <span>BOILERPLATE · ABOUT THE BUREAU</span>
          </div>
          <h2 className="mt-4 max-w-[36ch] font-display text-2xl leading-snug tracking-tight text-[var(--text-strong)] sm:text-3xl">
            The Bureau of Acoustic Gasology is the issuing authority of record for civilian
            acoustic events.
          </h2>
        </div>
        <div className="flex flex-col items-end gap-2 text-[var(--accent-brass)]">
          <Seal size={56} className="opacity-95" />
          <Chip tone="brass">DOCKET № {PRESS_DOCKET}</Chip>
        </div>
      </header>

      <p className="mt-5 max-w-[68ch] font-display text-[1rem] leading-relaxed text-[var(--text-default)] sm:text-[1.05rem]">
        Established for the purpose of standardised reporting on neglected audio formats, the
        Bureau operates from Station OPS-04 and issues clinically unnecessary diagnostic reports
        under §0.1 of the Release Provision. The Bureau maintains a founding ledger, a
        serialised filing system, and a public correspondence desk; it accepts no medical
        liability and assumes immense cultural responsibility.
      </p>

      <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-[var(--border-stark)] pt-5">
        <div className="font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
          PRESS CONTACT · DESK §9.1 · STATION OPS-04 · MMXXVI
        </div>
        <div className="font-display text-[1.1rem] leading-none tracking-widest text-[var(--accent-brass)]">
          # # #
        </div>
      </div>
    </article>
  </motion.section>
);
