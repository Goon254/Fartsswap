'use client';

import { motion } from 'framer-motion';
import type { FC } from 'react';
import { Chip } from '@/components/Chip';
import { Seal } from '@/components/Seal';
import { formatCycleDate, type WrappedIssue } from '@/lib/fart-wrapped';

interface ClosingNoticeProps {
  issue: WrappedIssue;
}

const EASE = [0.22, 0.61, 0.36, 1] as const;

/**
 * §V — Closing ceremonial statement.
 *
 * Reads as the last page of the annual review. A single bordered article
 * with a large display headline pulled from `issue.closingStatement`, a
 * brass Bureau seal on the right, and a footer band carrying the cycle
 * id, issue date, and a `# # #` sign-off mark to mirror the press kit's
 * boilerplate card. No CTAs — the page is finished by this point.
 */
export const ClosingNotice: FC<ClosingNoticeProps> = ({ issue }) => (
  <motion.section
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.55, ease: EASE }}
    className="mx-auto w-full max-w-7xl px-6 pb-16 lg:px-10 lg:pb-24"
  >
    <article
      className={[
        'relative overflow-hidden rounded-md border border-[var(--border-stark)]',
        'bg-[color-mix(in_oklab,var(--bg-panel)_85%,transparent)] px-7 py-9 sm:px-10 sm:py-12',
        'shadow-[0_30px_70px_-40px_color-mix(in_oklab,black_70%,transparent)]',
      ].join(' ')}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 font-mono text-[0.62rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
            <span aria-hidden="true" className="brand-rule h-px w-8 opacity-90" />
            <span className="rounded-sm border border-[var(--border-brass)] px-1.5 py-px text-[0.6rem]">
              §V
            </span>
            <span>CLOSING STATEMENT · BUREAU ISSUE</span>
          </div>
          <h2 className="mt-4 max-w-[40ch] font-display text-2xl leading-snug tracking-tight text-[var(--text-strong)] sm:text-3xl">
            Further review has been deemed unnecessary but inevitable.
          </h2>
        </div>
        <div className="flex flex-col items-end gap-2 text-[var(--accent-brass)]">
          <Seal size={64} className="opacity-95" />
          <Chip tone="brass">{issue.cycleLabel}</Chip>
        </div>
      </header>

      <p className="mt-6 max-w-[72ch] font-display text-[1.05rem] leading-relaxed text-[var(--text-default)] sm:text-[1.1rem]">
        {issue.closingStatement}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-[var(--border-stark)] pt-5 font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
        <div>
          ISSUED · {formatCycleDate(issue.issuedAtIso)} · DOCKET {issue.wrappedCycleId}
        </div>
        <div className="font-display text-[1.1rem] leading-none tracking-widest text-[var(--accent-brass)]">
          # # #
        </div>
      </div>
    </article>
  </motion.section>
);
