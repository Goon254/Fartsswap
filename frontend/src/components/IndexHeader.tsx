'use client';

import { motion } from 'framer-motion';
import type { FC } from 'react';
import { Chip } from '@/components/Chip';
import { Seal } from '@/components/Seal';
import {
  formatIssueDate,
  severityChipTone,
  type MethaneIndexIssue,
} from '@/lib/methane-index';

interface IndexHeaderProps {
  issue: MethaneIndexIssue;
  /** Ceremonial "powered by" — does not alter bulletin truth. */
  poweredBy?: {
    line: string;
    disclosure?: string;
    destinationUrl?: string;
    placementId?: string;
  };
  /** When user follows optional partner outbound link. */
  onPartnerLinkClick?: () => void;
}

const EASE = [0.22, 0.61, 0.36, 1] as const;

/**
 * Bulletin header for /methane-index.
 *
 * Reads as a national-bulletin masthead: top docket strip (issue id,
 * department, threat-climate chip), then a two-column rail with the
 * title block on the left (eyebrow + display headline + subtitle + filed
 * line) and a small certification panel on the right (seal + filed-by
 * attribution + issued date).
 */
export const IndexHeader: FC<IndexHeaderProps> = ({ issue, poweredBy, onPartnerLinkClick }) => (
  <motion.section
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.55, ease: EASE }}
    className="mx-auto w-full max-w-7xl px-6 pt-8 lg:px-10 lg:pt-12"
  >
    {/* — Docket strip — */}
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[var(--border-stark)] bg-[color-mix(in_oklab,var(--bg-panel-strong)_90%,transparent)] px-5 py-3">
      <div className="flex items-center gap-3 font-mono text-[0.62rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
        <span aria-hidden="true" className="brand-rule h-px w-6 opacity-90" />
        <span className="text-[var(--accent-brass)]">BULLETIN · No. {issue.issueNumber}</span>
        <span aria-hidden="true" className="hidden h-3 w-px bg-[var(--border-stark)] md:inline-block" />
        <span className="hidden md:inline">{issue.department}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Chip tone="brass">{issue.weekLabel}</Chip>
        <Chip tone={severityChipTone(issue.threatClimate)} withDot>
          THREAT CLIMATE · {issue.threatClimateLabel}
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
          <span>PUBLIC BULLETIN · CLASSIFICATION INTELLIGENCE</span>
        </div>
        <h1
          className={[
            'mt-5 max-w-[22ch] font-display font-medium leading-[1.02] tracking-tight',
            'text-[var(--text-strong)] text-shadow-glow',
            'text-[2.4rem] sm:text-[3.1rem] md:text-[3.8rem] lg:text-[4.2rem]',
          ].join(' ')}
        >
          {issue.title}
        </h1>
        <p className="mt-5 max-w-[58ch] text-[0.95rem] leading-relaxed text-[var(--text-default)]">
          {issue.subtitle}
        </p>
      </div>

      <aside className="self-start rounded-md border border-[var(--border-brass)] bg-[color-mix(in_oklab,var(--accent-brass)_5%,transparent)] p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
            <span aria-hidden="true" className="brand-rule h-px w-5 opacity-90" />
            FILED FOR NATIONAL REVIEW
          </div>
          <div className="text-[var(--accent-brass)]">
            <Seal size={48} className="opacity-95" />
          </div>
        </div>
        <ul className="mt-3 flex flex-col gap-2 text-[0.85rem] leading-snug text-[var(--text-default)]">
          <RailRow label="DOCKET" value={issue.issueId} />
          <RailRow label="ISSUED" value={formatIssueDate(issue.issuedAtIso)} />
          <RailRow label="DEPARTMENT" value={issue.department} />
          <RailRow label="CYCLE" value={issue.weekLabel} />
        </ul>
        {poweredBy ? (
          <div className="mt-4 border-t border-dashed border-[var(--border-stark)] pt-4">
            <p className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
              CEREMONIAL PATRONAGE
            </p>
            <p className="mt-1 text-[0.8rem] leading-snug text-[var(--text-muted)]">{poweredBy.line}</p>
            {poweredBy.disclosure ? (
              <p className="mt-2 text-[0.65rem] leading-snug text-[var(--text-faint)]">{poweredBy.disclosure}</p>
            ) : null}
            {poweredBy.destinationUrl ? (
              <a
                href={poweredBy.destinationUrl}
                className="mt-2 inline-block font-mono text-[0.6rem] uppercase tracking-wide-2 text-[var(--accent-teal)] underline-offset-2 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
                data-placement-id={poweredBy.placementId}
                onClick={() => onPartnerLinkClick?.()}
              >
                Partner site
              </a>
            ) : null}
          </div>
        ) : null}
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
