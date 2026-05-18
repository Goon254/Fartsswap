'use client';

import { motion } from 'framer-motion';
import type { FC } from 'react';
import { Chip } from '@/components/Chip';
import { Seal } from '@/components/Seal';

interface RegulatoryNoticeProps {
  /** Visible filing number shown in the top-right ledger. */
  filingNumber: string;
  /** "PRIVATE BETA · WIDENING" — the release-status label. */
  releaseStatus: string;
}

const EASE = [0.22, 0.61, 0.36, 1] as const;

/**
 * Institutional proof band.
 *
 * Reads as a notice posted on a government-office wall: a top filing
 * ledger (filing number, release status, classification), the body of
 * the notice in two columns (purpose + provisions), and a row of
 * bureau departments along the bottom. The Seal sits left of the body
 * to anchor the notice as an issued document rather than a hero card.
 */
export const RegulatoryNotice: FC<RegulatoryNoticeProps> = ({ filingNumber, releaseStatus }) => (
  <motion.section
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: EASE }}
    className="mx-auto w-full max-w-7xl px-6 lg:px-10"
  >
    <article
      className={[
        'relative isolate overflow-hidden rounded-md border border-[var(--border-stark)]',
        'bg-[color-mix(in_oklab,var(--bg-panel)_85%,transparent)]',
        'shadow-[0_30px_80px_-40px_color-mix(in_oklab,black_70%,transparent)]',
      ].join(' ')}
    >
      {/* — Top ledger — */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-[var(--border-stark)] bg-[var(--bg-panel-strong)] px-5 py-3">
        <div className="flex items-center gap-3 font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
          <span aria-hidden="true" className="brand-rule h-px w-6 opacity-90" />
          <span className="text-[var(--accent-brass)]">PUBLIC NOTICE · RELEASE PROVISION</span>
          <span aria-hidden="true" className="hidden h-3 w-px bg-[var(--border-stark)] md:inline-block" />
          <span className="hidden md:inline">Issued by the Bureau of Acoustic Gasology</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone="brass">FILING № {filingNumber}</Chip>
          <Chip tone="amber" withDot>
            {releaseStatus}
          </Chip>
        </div>
      </div>

      {/* — Body — */}
      <div className="grid grid-cols-1 items-start gap-8 px-6 py-7 sm:px-8 lg:grid-cols-[auto_1fr_1fr] lg:gap-10">
        <div className="hidden lg:block">
          <Seal size={108} className="text-[var(--accent-brass)] opacity-95" />
          <div className="mt-3 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
            B·A·G · Station OPS-04
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
            <span aria-hidden="true" className="brand-rule h-px w-6 opacity-90" />
            ARTICLE I · PURPOSE
          </div>
          <h2 className="mt-3 font-display text-2xl leading-snug tracking-tight text-[var(--text-strong)] sm:text-3xl">
            Notice of intent to open the public filing line for documented acoustic events.
          </h2>
          <p className="mt-3 max-w-[44ch] text-[0.95rem] leading-relaxed text-[var(--text-default)]">
            The Bureau hereby gives notice that, pursuant to §0.1 of the Release Provision, civilian
            submissions of acoustic samples will be accepted and processed under standard
            clinically-unnecessary-report procedures.
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2 font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
            <span aria-hidden="true" className="brand-rule h-px w-6 opacity-90" />
            ARTICLE II · PROVISIONS
          </div>
          <ul className="mt-3 grid grid-cols-1 gap-1.5">
            {PROVISIONS.map((line) => (
              <li
                key={line}
                className="flex gap-2 text-[0.9rem] leading-snug text-[var(--text-default)] before:mt-[0.55rem] before:h-px before:w-3 before:flex-none before:bg-[var(--accent-brass)] before:content-['']"
              >
                {line}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* — Departments — */}
      <div className="grid grid-cols-2 gap-px overflow-hidden border-t border-[var(--border-subtle)] bg-[var(--border-subtle)] sm:grid-cols-4">
        {DEPARTMENTS.map((dep) => (
          <div key={dep.code} className="flex flex-col gap-1 bg-[var(--bg-panel)] px-4 py-3">
            <div className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
              {dep.code}
            </div>
            <div className="text-[0.85rem] leading-snug text-[var(--text-default)]">{dep.name}</div>
            <div className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
              {dep.detail}
            </div>
          </div>
        ))}
      </div>
    </article>
  </motion.section>
);

const PROVISIONS = [
  'Filing is open to all natural persons, regardless of jurisdiction or dietary regime.',
  'Each submission is processed under the standard ten-second acoustic ceiling.',
  'Reports are issued without medical value and with immense cultural value.',
  'The Bureau reserves the right to seal, redact, or framing-rotate any artifact.',
] as const;

const DEPARTMENTS = [
  {
    code: 'DEPT · §4.2',
    name: 'Acoustic Records',
    detail: 'Filing, hashing, ledger',
  },
  {
    code: 'DEPT · §5.7',
    name: 'Cultural Significance',
    detail: 'Cinematic parallel review',
  },
  {
    code: 'DEPT · §6.3',
    name: 'Artifact Issuance',
    detail: 'Certification & seal',
  },
  {
    code: 'DEPT · §9.1',
    name: 'Press & Diplomatic Correspondence',
    detail: 'Embargo packets · attaches',
  },
] as const;
