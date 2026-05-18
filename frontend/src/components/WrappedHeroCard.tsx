'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import type { FC } from 'react';
import { Chip } from '@/components/Chip';
import { Seal } from '@/components/Seal';
import {
  threatToTone,
  type ClassificationBreakdownRow,
  type WrappedIssue,
} from '@/lib/fart-wrapped';

interface WrappedHeroCardProps {
  issue: WrappedIssue;
  onClassificationOpened: (row: ClassificationBreakdownRow) => void;
}

const EASE = [0.22, 0.61, 0.36, 1] as const;

/**
 * Signature stat moment.
 *
 * The page's "one section a creator screenshots" block. Sits directly
 * below the masthead with two columns:
 *
 *   - Left: primary classification + ceremonial score readout (display
 *     type, tabular-nums) + percentile + national comparison strip.
 *   - Right: classification breakdown ledger (compact list with brass
 *     bars + per-row open-dossier links).
 *
 * National comparison ("Your cycle average: 73 \u00B7 National average: 61.4")
 * threads the bulletin world into the personal review without leaving
 * the brand voice.
 */
export const WrappedHeroCard: FC<WrappedHeroCardProps> = ({ issue, onClassificationOpened }) => (
  <motion.section
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.55, ease: EASE }}
    className="mx-auto w-full max-w-7xl px-6 lg:px-10"
  >
    <header className="mb-6 flex flex-wrap items-center gap-3 font-mono text-[0.65rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
      <span aria-hidden="true" className="brand-rule h-px w-8 opacity-90" />
      <span className="rounded-sm border border-[var(--border-brass)] px-1.5 py-px text-[0.6rem]">
        §I
      </span>
      <span>SIGNATURE STAT · CITATION OF THE CYCLE</span>
      <span aria-hidden="true" className="brand-rule h-px flex-1 opacity-40" />
    </header>

    <article
      className={[
        'relative isolate overflow-hidden rounded-md border border-[var(--border-brass)]',
        'bg-[color-mix(in_oklab,var(--accent-brass)_5%,transparent)] p-7 sm:p-10',
        'shadow-[0_40px_80px_-40px_color-mix(in_oklab,black_70%,transparent)]',
      ].join(' ')}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-[var(--accent-brass)] opacity-95"
      />

      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
        {/* — Left: primary stat — */}
        <div>
          <div className="flex items-center gap-2 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
            <span aria-hidden="true" className="brand-rule h-px w-5 opacity-90" />
            PRIMARY CLASSIFICATION · {issue.cycleLabel}
          </div>
          <h2
            className={[
              'mt-3 font-display font-medium leading-[0.95] tracking-tight text-[var(--text-strong)]',
              'text-[clamp(2.4rem,7vw,5rem)]',
            ].join(' ')}
          >
            {issue.primaryClassification}
          </h2>
          <p className="mt-3 font-display italic text-[1.05rem] leading-snug text-[var(--accent-brass)]">
            Filed under §0.1. Recorded in {issue.cycleLabel.split('·')[0].trim()}. Held for personal record.
          </p>

          {/* — Ceremonial score readout — */}
          <div className="mt-7 grid grid-cols-2 gap-6">
            <ScoreReadout
              label="AVERAGE POWER SCORE"
              value={issue.averagePowerScore.toString()}
              unit="/ 100"
              accent
            />
            <ScoreReadout
              label="NATIONAL AVERAGE"
              value={issue.nationalAverageScore.toFixed(1)}
              unit="/ 100"
            />
          </div>

          {/* — Comparison strip — */}
          <ComparisonStrip
            you={issue.averagePowerScore}
            national={issue.nationalAverageScore}
          />

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Chip tone={threatToTone(issue.dominantThreatLevel)} withDot>
              DOMINANT THREAT · {issue.dominantThreatLevel.toUpperCase()}
            </Chip>
            <Chip tone="brass">PERCENTILE · {issue.percentile}</Chip>
            <Chip tone="neutral">{issue.rankLabel.toUpperCase()}</Chip>
          </div>
        </div>

        {/* — Right: breakdown ledger — */}
        <div
          className={[
            'rounded-md border border-[var(--border-stark)] bg-[var(--bg-panel)] p-6',
            'shadow-[0_30px_60px_-30px_color-mix(in_oklab,black_70%,transparent)]',
          ].join(' ')}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
              <span aria-hidden="true" className="brand-rule h-px w-5 opacity-90" />
              CLASSIFICATION BREAKDOWN
            </div>
            <div className="text-[var(--accent-brass)]">
              <Seal size={36} className="opacity-90" />
            </div>
          </div>
          <ul className="mt-4 flex flex-col gap-3">
            {issue.classificationBreakdown.map((row, i) => (
              <BreakdownRow
                key={row.classification}
                row={row}
                rank={i + 1}
                onOpen={() => onClassificationOpened(row)}
              />
            ))}
          </ul>
          <footer className="mt-5 border-t border-dashed border-[var(--border-subtle)] pt-3 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
            {issue.classificationBreakdown.reduce((acc, r) => acc + r.count, 0)} TOTAL FILINGS · CYCLE LEDGER
          </footer>
        </div>
      </div>
    </article>
  </motion.section>
);

const ScoreReadout: FC<{ label: string; value: string; unit: string; accent?: boolean }> = ({
  label,
  value,
  unit,
  accent,
}) => (
  <div>
    <div className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
      {label}
    </div>
    <div className="mt-1 flex items-baseline gap-2">
      <span
        className={[
          'font-display tracking-tight',
          accent ? 'text-[var(--text-strong)]' : 'text-[var(--text-default)]',
        ].join(' ')}
        style={{
          fontSize: 'clamp(2rem, 6vw, 3rem)',
          lineHeight: 0.95,
          fontWeight: 500,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </span>
      <span className="font-mono text-[0.65rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
        {unit}
      </span>
    </div>
  </div>
);

const ComparisonStrip: FC<{ you: number; national: number }> = ({ you, national }) => {
  const delta = you - national;
  const sign = delta > 0 ? '+' : '';
  const tone =
    delta > 0
      ? 'text-[var(--color-alert-green)]'
      : delta < 0
        ? 'text-[var(--color-alert-red)]'
        : 'text-[var(--text-muted)]';
  return (
    <div className="mt-5 rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-panel-strong)] p-4">
      <div className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
        DELTA · YOU vs NATIONAL AVERAGE
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span
          className={`font-display ${tone}`}
          style={{
            fontVariantNumeric: 'tabular-nums',
            fontSize: 'clamp(1.4rem, 4vw, 1.9rem)',
            lineHeight: 1,
            fontWeight: 500,
          }}
        >
          {sign}
          {delta.toFixed(1)}
        </span>
        <span className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
          POINTS · YOU OVER COHORT
        </span>
      </div>
      <div className="mt-3 grid grid-cols-[3.4rem_1fr] items-center gap-3">
        <span className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
          YOU
        </span>
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-panel)]">
          <div
            className="h-full rounded-full bg-[var(--accent-brass)]"
            style={{ width: `${Math.min(100, Math.max(0, you))}%` }}
          />
        </div>
        <span className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
          NAT.
        </span>
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg-panel)]">
          <div
            className="h-full rounded-full bg-[var(--text-muted)] opacity-70"
            style={{ width: `${Math.min(100, Math.max(0, national))}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const BreakdownRow: FC<{
  row: ClassificationBreakdownRow;
  rank: number;
  onOpen: () => void;
}> = ({ row, rank, onOpen }) => {
  const href = `/report?variant=${encodeURIComponent(row.variantId)}&from=fart-wrapped`;
  return (
    <li>
      <Link
        href={href}
        onClick={onOpen}
        className="group/breakdown flex items-center gap-3 rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-panel-strong)] px-3 py-2 transition-colors hover:border-[var(--accent-brass)]"
      >
        <span className="w-5 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
          {String(rank).padStart(2, '0')}
        </span>
        <span className="min-w-0 flex-1">
          <div className="truncate font-display text-[0.95rem] leading-tight text-[var(--text-strong)]">
            {row.classification}
          </div>
          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-[var(--bg-panel)]">
            <div
              className="h-full rounded-full bg-[var(--accent-brass)]"
              style={{ width: `${row.share}%` }}
            />
          </div>
        </span>
        <span
          className="font-mono text-[0.7rem] text-[var(--text-default)]"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {row.share}%
        </span>
      </Link>
    </li>
  );
};
