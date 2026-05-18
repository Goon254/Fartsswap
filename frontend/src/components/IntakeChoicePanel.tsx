'use client';

import { motion } from 'framer-motion';
import type { FC, KeyboardEvent } from 'react';
import { Chip } from '@/components/Chip';
import { PrivacyNotice } from '@/components/PrivacyNotice';

interface IntakeChoicePanelProps {
  onChoose: (path: 'record' | 'fake') => void;
}

const EASE = [0.22, 0.61, 0.36, 1] as const;

/**
 * Step 1 of the analyze flow — path selection.
 *
 * Two large path cards (Analyze My Fart, Generate a Fake One), a three-step
 * "how this works" strip, and the detailed privacy notice. The two cards
 * are buttons (not links) so the flow stays in-page; AnalyzeFlowClient
 * handles the transition.
 *
 * Visual idea: each card is a "submission panel" with a roman numeral, a
 * dense mono header, an editorial title, body, and a brass underline that
 * animates on hover. The "RECORD" card is recommended (brass border +
 * preferred chip) so first-time visitors land on the strongest experience.
 */
export const IntakeChoicePanel: FC<IntakeChoicePanelProps> = ({ onChoose }) => (
  <motion.section
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.55, ease: EASE }}
    className="mx-auto w-full max-w-7xl px-6 pb-16 pt-8 lg:px-10 lg:pt-12"
  >
    {/* — Eyebrow header — */}
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="flex items-center gap-3 font-mono text-[0.62rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
          <span aria-hidden="true" className="brand-rule h-px w-8 opacity-90" />
          <span className="rounded-sm border border-[var(--border-brass)] px-1.5 py-px text-[0.6rem]">
            §01
          </span>
          <span>BUREAU INTAKE TERMINAL · ACOUSTIC SUBMISSION</span>
        </div>
        <h1 className="mt-4 max-w-[20ch] font-display text-[2.4rem] font-medium leading-[1.02] tracking-tight text-[var(--text-strong)] sm:text-[3rem] md:text-[3.6rem]">
          Submit a sample.{' '}
          <span className="italic text-[var(--accent-brass)]">Or invent one.</span>
        </h1>
        <p className="mt-5 max-w-[58ch] text-base leading-relaxed text-[var(--text-default)]">
          The Bureau accepts captured emissions and synthetic submissions with equal seriousness.
          Choose a route below. The full dossier is issued in under ten seconds either way.
        </p>
      </div>
      <Chip tone="brass">SESSION · ANONYMOUS</Chip>
    </div>

    {/* — Two large path cards — */}
    <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-2">
      <PathCard
        path="record"
        numeral="I"
        code="AGD-010 · RECORD"
        title="Analyze my fart"
        body="Capture a ten-second sample using the recording chamber. The Bureau will return a full dossier in approximately five seconds."
        bullets={[
          'In-browser capture',
          '10-second maximum',
          'No public posting by default',
        ]}
        ctaLabel="Open recording chamber"
        recommended
        onChoose={() => onChoose('record')}
      />
      <PathCard
        path="fake"
        numeral="II"
        code="AGD-020 · SYNTHETIC"
        title="Generate a fake one"
        body="Skip capture. The Bureau will fabricate a dossier from the synthetic register. Outputs are indistinguishable from real ones."
        bullets={[
          'No microphone access',
          'Instant submission',
          'Dossier identical in form',
        ]}
        ctaLabel="Issue a synthetic dossier"
        onChoose={() => onChoose('fake')}
      />
    </div>

    {/* — "How this works" strip — */}
    <div className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-md border border-[var(--border-subtle)] bg-[var(--border-subtle)] sm:grid-cols-3">
      <HowStep numeral="I" label="CAPTURE" detail="A sample is acquired or synthesised." />
      <HowStep numeral="II" label="ANALYZE" detail="FartGPT runs tonal inference against the register." />
      <HowStep numeral="III" label="CLASSIFY" detail="A signed dossier is issued under Bureau authority." />
    </div>

    {/* — Privacy panel — */}
    <div className="mt-8">
      <PrivacyNotice variant="detailed" />
    </div>
  </motion.section>
);

interface PathCardProps {
  path: 'record' | 'fake';
  numeral: string;
  code: string;
  title: string;
  body: string;
  bullets: readonly string[];
  ctaLabel: string;
  recommended?: boolean;
  onChoose: () => void;
}

const PathCard: FC<PathCardProps> = ({
  numeral,
  code,
  title,
  body,
  bullets,
  ctaLabel,
  recommended = false,
  onChoose,
}) => {
  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    // Enter / Space already handled by native <button>; this is here so the
    // file-level reader can see we considered the keyboard path. No-op.
    void e;
  };

  return (
    <motion.button
      type="button"
      onClick={onChoose}
      onKeyDown={onKey}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.995 }}
      transition={{ duration: 0.18, ease: EASE }}
      className={[
        'group/path relative isolate flex h-full flex-col gap-6 rounded-md p-7 text-left',
        'border bg-[var(--bg-panel)] transition-colors duration-200',
        recommended
          ? 'border-[var(--border-brass)] hover:border-[var(--accent-brass)]'
          : 'border-[var(--border-subtle)] hover:border-[var(--border-stark)]',
        'shadow-[0_20px_50px_-30px_color-mix(in_oklab,black_70%,transparent)]',
      ].join(' ')}
    >
      {/* hover brass top rule */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px scale-x-0 origin-left bg-[var(--accent-brass)] transition-transform duration-500 group-hover/path:scale-x-100"
      />

      <div className="flex items-baseline justify-between">
        <span className="font-display text-5xl leading-none tracking-tight text-[var(--accent-brass)] opacity-90">
          {numeral}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {recommended ? <Chip tone="brass">RECOMMENDED</Chip> : null}
          <Chip tone="neutral">{code}</Chip>
        </div>
      </div>

      <div>
        <h2 className="font-display text-3xl leading-tight tracking-tight text-[var(--text-strong)]">
          {title}
        </h2>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-[var(--text-default)]">{body}</p>
      </div>

      <ul className="flex flex-col gap-1.5">
        {bullets.map((b) => (
          <li
            key={b}
            className="flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-wide-3 text-[var(--text-muted)]"
          >
            <span aria-hidden="true" className="h-px w-3 bg-[var(--accent-brass)]" />
            <span>{b}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto flex items-center justify-between border-t border-[var(--border-subtle)] pt-5">
        <span className="font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
          PROCEED →
        </span>
        <span
          className={[
            'inline-flex items-center gap-2 rounded-sm px-3 py-2 font-mono text-[0.65rem] uppercase tracking-wide-3',
            'transition-colors duration-200',
            recommended
              ? 'bg-[var(--accent-brass)] text-[var(--bg-base)]'
              : 'ring-1 ring-inset ring-[var(--border-stark)] text-[var(--text-strong)] group-hover/path:ring-[var(--accent-teal)] group-hover/path:text-[var(--accent-teal)]',
          ].join(' ')}
        >
          {ctaLabel}
          <ArrowSmall />
        </span>
      </div>
    </motion.button>
  );
};

const HowStep: FC<{ numeral: string; label: string; detail: string }> = ({
  numeral,
  label,
  detail,
}) => (
  <div className="flex flex-col gap-2 bg-[var(--bg-panel)] px-5 py-5">
    <div className="flex items-center gap-2 font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
      <span className="rounded-sm border border-[var(--border-brass)] px-1.5 py-px">{numeral}</span>
      <span>{label}</span>
    </div>
    <div className="text-sm text-[var(--text-default)]">{detail}</div>
  </div>
);

const ArrowSmall: FC = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
    <path
      d="M1 6h9M7 3l3 3-3 3"
      stroke="currentColor"
      strokeWidth="1.4"
      fill="none"
      strokeLinecap="square"
      strokeLinejoin="miter"
    />
  </svg>
);
