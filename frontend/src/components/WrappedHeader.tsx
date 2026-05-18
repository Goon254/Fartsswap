'use client';

import { motion } from 'framer-motion';
import type { FC } from 'react';
import { Chip } from '@/components/Chip';
import { Seal } from '@/components/Seal';
import {
  formatCycleDate,
  threatToTone,
  type WrappedIssue,
} from '@/lib/fart-wrapped';

interface WrappedHeaderProps {
  issue: WrappedIssue;
}

const EASE = [0.22, 0.61, 0.36, 1] as const;

/**
 * Fart Wrapped masthead.
 *
 * Reads as the cover page of an annual review: a top docket strip with
 * cycle id + classification chips, then a two-column rail with the major
 * statement on the left ("Your year in acoustic consequence.") and a
 * brass-bordered citation panel on the right (subject alias + cycle +
 * issued date + dominant threat).
 *
 * This is the first thing on the page; it leans more theatrical than the
 * Methane Index masthead (bigger headline, italic accent, ceremonial
 * citation panel) while staying inside the same brand world.
 */
export const WrappedHeader: FC<WrappedHeaderProps> = ({ issue }) => (
  <motion.section
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6, ease: EASE }}
    className="mx-auto w-full max-w-7xl px-6 pt-8 lg:px-10 lg:pt-12"
  >
    {/* — Docket strip — */}
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[var(--border-stark)] bg-[color-mix(in_oklab,var(--bg-panel-strong)_90%,transparent)] px-5 py-3">
      <div className="flex items-center gap-3 font-mono text-[0.62rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
        <span aria-hidden="true" className="brand-rule h-px w-6 opacity-90" />
        <span className="text-[var(--accent-brass)]">FART WRAPPED · ANNUAL REVIEW</span>
        <span aria-hidden="true" className="hidden h-3 w-px bg-[var(--border-stark)] md:inline-block" />
        <span className="hidden md:inline">Bureau of Acoustic Gasology · Station OPS-04</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Chip tone="brass">{issue.cycleLabel}</Chip>
        <Chip tone={threatToTone(issue.dominantThreatLevel)} withDot>
          THREAT · {issue.dominantThreatLevel.toUpperCase()}
        </Chip>
      </div>
    </div>

    {/* — Title rail — */}
    <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1.55fr_1fr] lg:gap-12">
      <div>
        <div className="flex items-center gap-3 font-mono text-[0.62rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
          <span aria-hidden="true" className="brand-rule h-px w-8 opacity-90" />
          <span className="rounded-sm border border-[var(--border-brass)] px-1.5 py-px text-[0.6rem]">
            §0
          </span>
          <span>PERSONAL CYCLE REVIEW · CITIZEN UNDER OBSERVATION</span>
        </div>
        <h1
          className={[
            'mt-5 max-w-[20ch] font-display font-medium leading-[1.0] tracking-tight',
            'text-[var(--text-strong)] text-shadow-glow',
            'text-[2.6rem] sm:text-[3.4rem] md:text-[4.2rem] lg:text-[4.8rem]',
          ].join(' ')}
        >
          Your year in{' '}
          <span className="italic text-[var(--accent-brass)]">acoustic consequence.</span>
        </h1>
        <p className="mt-6 max-w-[58ch] text-[0.98rem] leading-relaxed text-[var(--text-default)]">
          Annual review of a citizen under emissions observation. Issued for personal record under
          §0.1 of the Release Provision. The Bureau makes no medical claim and assumes immense
          cultural responsibility.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Chip tone="brass">DOMINANT · {issue.primaryClassification.toUpperCase()}</Chip>
          <Chip tone="neutral">AVG SCORE · {issue.averagePowerScore} / 100</Chip>
          <Chip tone="amber" withDot>
            {issue.rankLabel.toUpperCase()}
          </Chip>
        </div>
      </div>

      {/* — Citation panel — */}
      <aside className="self-start rounded-md border border-[var(--border-brass)] bg-[color-mix(in_oklab,var(--accent-brass)_5%,transparent)] p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
            <span aria-hidden="true" className="brand-rule h-px w-5 opacity-90" />
            CITATION OF RECORD
          </div>
          <div className="text-[var(--accent-brass)]">
            <Seal size={56} className="opacity-95" />
          </div>
        </div>
        <div className="mt-3 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
          SUBJECT DESIGNATION
        </div>
        <div className="mt-0.5 font-display text-[1.4rem] leading-tight tracking-tight text-[var(--text-strong)]">
          {issue.subjectLabel}
        </div>
        <ul className="mt-4 flex flex-col gap-2 text-[0.85rem] leading-snug text-[var(--text-default)]">
          <RailRow label="ALIAS" value={issue.subjectAlias} />
          <RailRow label="CYCLE" value={issue.cycleLabel} />
          <RailRow label="ISSUED" value={formatCycleDate(issue.issuedAtIso)} />
          <RailRow label="DOCKET" value={issue.wrappedCycleId} />
        </ul>
      </aside>
    </div>
  </motion.section>
);

const RailRow: FC<{ label: string; value: string }> = ({ label, value }) => (
  <li>
    <div className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
      {label}
    </div>
    <div className="mt-0.5 text-[var(--text-default)]">{value}</div>
  </li>
);
