'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import type { FC } from 'react';
import { Chip } from '@/components/Chip';
import { MovementBadge } from '@/components/MovementBadge';
import { severityChipTone, type ClassificationRow } from '@/lib/methane-index';

interface ClassificationMoversTableProps {
  rows: readonly ClassificationRow[];
  /** Stable issue id surfaced to the row-opened analytics. */
  issueId: string;
  onRowOpened: (row: ClassificationRow) => void;
}

const EASE = [0.22, 0.61, 0.36, 1] as const;
const ROMAN: readonly string[] = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

/**
 * Classification movers ledger.
 *
 * The page's centrepiece — a market-style ranking table that reads as a
 * national bulletin, not a stock exchange screenshot. Three layouts in
 * one component:
 *
 *   - Mobile (default): each row stacks vertically as a card with the
 *     rank Roman numeral as a chunky leading column and the rest of the
 *     fields below.
 *   - Tablet+ (lg): the rows become a real columnar table with seven
 *     columns: rank, classification, movement, severity, volume,
 *     shareability, and a per-row link to the dossier.
 *
 * Every row hyperlinks to /report?variant=<id>&from=methane-index so
 * journalists / creators can land on the live dossier directly. The
 * parent owns the analytics event so attribution stays consistent.
 */
export const ClassificationMoversTable: FC<ClassificationMoversTableProps> = ({
  rows,
  issueId,
  onRowOpened,
}) => (
  <motion.section
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.55, ease: EASE }}
    className="mx-auto w-full max-w-7xl px-6 lg:px-10"
  >
    <header className="mb-6 flex flex-wrap items-center gap-3">
      <span aria-hidden="true" className="brand-rule h-px w-8 opacity-90" />
      <span className="rounded-sm border border-[var(--border-brass)] px-1.5 py-px font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
        §II
      </span>
      <span className="font-mono text-[0.65rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
        CLASSIFICATION MOVERS · WEEKLY LEDGER
      </span>
      <span aria-hidden="true" className="brand-rule h-px flex-1 opacity-40" />
      <span className="hidden font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)] md:inline">
        {issueId.toUpperCase()}
      </span>
    </header>

    <article
      className={[
        'overflow-hidden rounded-md border border-[var(--border-stark)] bg-[var(--bg-panel)]',
        'shadow-[0_30px_80px_-40px_color-mix(in_oklab,black_70%,transparent)]',
      ].join(' ')}
    >
      {/* — Desktop column headers — */}
      <div
        role="row"
        className={[
          'hidden items-center gap-4 border-b border-dashed border-[var(--border-stark)]',
          'bg-[var(--bg-panel-strong)] px-6 py-3 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]',
          'lg:grid lg:grid-cols-[3rem_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.7fr)_minmax(0,1.1fr)_auto]',
        ].join(' ')}
      >
        <span role="columnheader">RANK</span>
        <span role="columnheader">CLASSIFICATION</span>
        <span role="columnheader">MOVEMENT · 7D</span>
        <span role="columnheader">SEVERITY</span>
        <span role="columnheader" className="text-right">VOLUME</span>
        <span role="columnheader" className="text-right">SHAREABILITY</span>
        <span role="columnheader" className="text-right">DOSSIER</span>
      </div>

      <ul className="divide-y divide-[var(--border-subtle)]">
        {rows.map((row) => (
          <Row key={row.id} row={row} onRowOpened={onRowOpened} />
        ))}
      </ul>
    </article>
  </motion.section>
);

interface RowProps {
  row: ClassificationRow;
  onRowOpened: (row: ClassificationRow) => void;
}

const Row: FC<RowProps> = ({ row, onRowOpened }) => {
  const href = `/report?variant=${encodeURIComponent(row.variantId)}&from=methane-index`;
  return (
    <li>
      <div
        className={[
          'group/row block px-6 py-4 transition-colors hover:bg-[color-mix(in_oklab,var(--accent-brass)_4%,transparent)]',
          'grid grid-cols-1 items-center gap-4',
          'lg:grid-cols-[3rem_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,0.7fr)_minmax(0,1.1fr)_auto]',
        ].join(' ')}
      >
        {/* RANK */}
        <div className="flex items-center gap-3">
          <span
            className={[
              'font-display text-[var(--accent-brass)]',
              'text-[1.8rem] leading-none opacity-90',
            ].join(' ')}
            style={{ fontWeight: 500 }}
          >
            {ROMAN[row.rank - 1] ?? row.rank}
          </span>
          <span className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)] lg:hidden">
            №{row.rank.toString().padStart(2, '0')}
          </span>
        </div>

        {/* CLASSIFICATION */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-display text-[1.1rem] leading-tight tracking-tight text-[var(--text-strong)] sm:text-[1.2rem]">
              {row.classification}
            </h3>
            {row.warning ? <Chip tone="brass">{row.warning}</Chip> : null}
          </div>
          <p className="mt-1 max-w-[58ch] text-[0.85rem] leading-snug text-[var(--text-muted)]">
            {row.note}
          </p>
          {row.sponsorFootnote ? (
            <p className="mt-2 max-w-[58ch] border-l border-[var(--border-brass)] pl-2 font-mono text-[0.65rem] leading-snug text-[var(--text-faint)]">
              {row.sponsorFootnote}
            </p>
          ) : null}
        </div>

        {/* MOVEMENT */}
        <div className="flex flex-wrap items-center gap-2 lg:gap-3">
          <MovementBadge movement={row.movement} delta={row.movementDelta} />
        </div>

        {/* SEVERITY */}
        <div>
          <Chip tone={severityChipTone(row.severity)} withDot>
            {row.severity.toUpperCase()}
          </Chip>
        </div>

        {/* VOLUME */}
        <div className="flex flex-col items-start lg:items-end">
          <span className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)] lg:hidden">
            VOLUME · 7D
          </span>
          <span
            className="font-display text-[1.05rem] leading-none tracking-tight text-[var(--text-strong)]"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {row.weeklyVolume.toLocaleString()}
          </span>
          <span className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)] lg:hidden">
            FILINGS
          </span>
        </div>

        {/* SHAREABILITY */}
        <div className="flex flex-col items-start lg:items-end">
          <span className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)] lg:hidden">
            SHAREABILITY
          </span>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[var(--bg-panel-strong)]">
              <div
                className="h-full rounded-full bg-[var(--accent-brass)]"
                style={{ width: `${row.shareability}%` }}
              />
            </div>
            <span
              className="font-mono text-[0.7rem] text-[var(--text-default)]"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {row.shareability}
            </span>
          </div>
        </div>

        {/* OPEN */}
        <div className="flex justify-end">
          <Link
            href={href}
            onClick={() => onRowOpened(row)}
            className={[
              'inline-flex h-7 items-center gap-1.5 rounded-sm border border-[var(--border-brass)]',
              'bg-[color-mix(in_oklab,var(--accent-brass)_8%,transparent)] px-3',
              'font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--accent-brass)]',
              'transition-colors hover:bg-[color-mix(in_oklab,var(--accent-brass)_18%,transparent)]',
            ].join(' ')}
          >
            OPEN DOSSIER
            <Arrow />
          </Link>
        </div>
      </div>
    </li>
  );
};

const Arrow: FC = () => (
  <svg width="10" height="10" viewBox="0 0 14 14" aria-hidden="true">
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
