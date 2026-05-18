'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import type { FC } from 'react';
import { Chip } from '@/components/Chip';

interface ResultHeaderProps {
  caseFile: string;
  issuedAtIso: string;
}

/**
 * Top chrome of the report page.
 *
 * Layout (desktop):
 *   [< Back to lab]   BUREAU · REPORT OUTPUT · PRIVATE ANALYSIS      [VERIFIED · CLASSIFIED · INTERNAL]
 *
 * On mobile the breadcrumb collapses to a single line and the chips wrap.
 * The whole strip sits inside a thin brass-keyed border so the report
 * "begins" at a defined edge.
 */
export const ResultHeader: FC<ResultHeaderProps> = ({ caseFile, issuedAtIso }) => (
  <motion.section
    initial={{ opacity: 0, y: -8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
    className={[
      'relative mx-auto w-full max-w-7xl px-6 pt-8 lg:px-10',
    ].join(' ')}
  >
    <div
      className={[
        'flex flex-col gap-4 rounded-md border border-[var(--border-subtle)]',
        'bg-[color-mix(in_oklab,var(--bg-panel)_70%,transparent)] px-5 py-4 backdrop-blur-md',
        'md:flex-row md:items-center md:justify-between',
      ].join(' ')}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-5">
        <Link
          href="/"
          className={[
            'group/back inline-flex items-center gap-2',
            'font-mono text-[0.62rem] uppercase tracking-wide-3',
            'text-[var(--text-muted)] hover:text-[var(--accent-teal)] transition-colors',
          ].join(' ')}
        >
          <BackArrow />
          <span>Back to lab</span>
        </Link>
        <span aria-hidden="true" className="hidden h-4 w-px bg-[var(--border-stark)] md:inline-block" />
        <nav
          aria-label="Breadcrumb"
          className="font-mono text-[0.62rem] uppercase tracking-wide-3 text-[var(--text-muted)]"
        >
          <span className="text-[var(--accent-brass)]">BUREAU OF ACOUSTIC GASOLOGY</span>
          <Slash />
          <span>REPORT OUTPUT</span>
          <Slash />
          <span className="text-[var(--text-default)]">PRIVATE ANALYSIS</span>
        </nav>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Chip tone="brass">CASE · {caseFile}</Chip>
        <Chip tone="green" withDot>
          VERIFIED
        </Chip>
        <Chip tone="teal">CLASSIFIED</Chip>
        <Chip tone="neutral">INTERNAL USE</Chip>
      </div>
    </div>

    {/* Tiny date-line under the chrome bar, anchored to the right rail. */}
    <div className="mt-2 flex items-center justify-end font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
      ISSUED · {formatIso(issuedAtIso)}
    </div>
  </motion.section>
);

const Slash: FC = () => (
  <span aria-hidden="true" className="mx-2 text-[var(--text-faint)]">
    /
  </span>
);

const BackArrow: FC = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
    <path
      d="M11 6 H2 M5 3 L2 6 L5 9"
      stroke="currentColor"
      strokeWidth="1.4"
      fill="none"
      strokeLinecap="square"
      strokeLinejoin="miter"
    />
  </svg>
);

function formatIso(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`
  );
}
