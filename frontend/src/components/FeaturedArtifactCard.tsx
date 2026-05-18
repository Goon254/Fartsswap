'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import type { FC } from 'react';
import { Chip } from '@/components/Chip';
import { Seal } from '@/components/Seal';
import { Waveform } from '@/components/Waveform';
import type { FeaturedArtifact } from '@/lib/methane-index';

interface FeaturedArtifactCardProps {
  featured: FeaturedArtifact;
  /** Fires when the user clicks an open-link CTA. */
  onOpen: (surface: 'report' | 'share') => void;
}

const EASE = [0.22, 0.61, 0.36, 1] as const;

/**
 * "Fart of the Day" — the bulletin's single featured artifact.
 *
 * Treated as a ceremonial honour, not a result page:
 *   - Top eyebrow: "TODAY'S BUREAU SELECTION · FART OF THE DAY".
 *   - Two-column layout: subject + caption + score on the left,
 *     ceremonial mini-poster on the right with seal, classification,
 *     score, and a waveform.
 *   - Two CTAs below the body: "Open ceremonial dossier" → /report and
 *     "Save share card" → /share. Both carry `from=methane-index` for
 *     attribution.
 *
 * The featured artifact deliberately doesn't expose raw audio or user
 * data; it carries a public-record subject ("An anonymous citizen of
 * Vienna…") so the honour is rendered without exposing a real upload.
 */
export const FeaturedArtifactCard: FC<FeaturedArtifactCardProps> = ({ featured, onOpen }) => {
  const reportHref = `/report?variant=${encodeURIComponent(featured.variantId)}&from=methane-index`;
  const shareHref = `/share?variant=${encodeURIComponent(featured.variantId)}&from=methane-index`;
  const threatTone = threatToTone(featured.threatLevel);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: EASE }}
      className="mx-auto w-full max-w-7xl px-6 lg:px-10"
    >
      <header className="mb-6 flex flex-wrap items-center gap-3 font-mono text-[0.65rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
        <span aria-hidden="true" className="brand-rule h-px w-8 opacity-90" />
        <span className="rounded-sm border border-[var(--border-brass)] px-1.5 py-px text-[0.6rem]">
          §III
        </span>
        <span>{featured.honorific}</span>
        <span aria-hidden="true" className="brand-rule h-px flex-1 opacity-40" />
      </header>

      <article
        className={[
          'relative isolate overflow-hidden rounded-md border border-[var(--border-brass)]',
          'bg-[color-mix(in_oklab,var(--accent-brass)_5%,transparent)] p-7 sm:p-9',
          'shadow-[0_40px_80px_-40px_color-mix(in_oklab,black_70%,transparent)]',
        ].join(' ')}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-8 top-0 h-px bg-[var(--accent-brass)] opacity-95"
        />

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-12">
          {/* — Left column: honor copy — */}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Chip tone={threatTone} withDot>
                THREAT · {featured.threatLevel.toUpperCase()}
              </Chip>
              <Chip tone="brass">SCORE {featured.powerScore} / 100</Chip>
              <Chip tone="neutral">HONORED THIS CYCLE</Chip>
            </div>
            <h2 className="mt-4 max-w-[18ch] font-display text-3xl font-medium leading-[1.05] tracking-tight text-[var(--text-strong)] sm:text-4xl">
              {featured.classification}
            </h2>
            <p className="mt-3 font-display italic text-[1.05rem] leading-snug text-[var(--accent-brass)]">
              {featured.subjectTitle}
            </p>
            <blockquote className="mt-5 max-w-[52ch] border-l-2 border-[var(--accent-brass)] pl-4 text-[0.98rem] leading-relaxed text-[var(--text-default)]">
              {`\u201C${featured.caption}\u201D`}
            </blockquote>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href={reportHref}
                onClick={() => onOpen('report')}
                className={[
                  'inline-flex items-center gap-2 rounded-sm bg-[var(--accent-brass)] px-5 py-3',
                  'font-mono text-[0.65rem] uppercase tracking-wide-2 text-[var(--bg-base)]',
                  'shadow-[0_1px_0_0_color-mix(in_oklab,white_18%,transparent)_inset,0_-1px_0_0_color-mix(in_oklab,black_22%,transparent)_inset]',
                  'transition-colors hover:bg-[var(--color-brass-400)]',
                ].join(' ')}
              >
                Open ceremonial dossier
                <Arrow />
              </Link>
              <Link
                href={shareHref}
                onClick={() => onOpen('share')}
                className={[
                  'inline-flex items-center gap-2 rounded-sm border border-[var(--border-stark)] bg-transparent px-5 py-3',
                  'font-mono text-[0.65rem] uppercase tracking-wide-2 text-[var(--text-strong)]',
                  'transition-colors hover:border-[var(--accent-teal)] hover:text-[var(--accent-teal)]',
                ].join(' ')}
              >
                Save share card
                <Arrow />
              </Link>
            </div>
          </div>

          {/* — Right column: ceremonial mini-poster — */}
          <CeremonialPoster featured={featured} />
        </div>

        <footer className="mt-7 flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-[var(--border-brass)] pt-4 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
          <span>
            HASH · <span className="text-[var(--text-default)]">{featured.reportHash}</span>
          </span>
          <span>
            FILED UNDER · §III · DAILY HONOR ROLL
          </span>
        </footer>
      </article>
    </motion.section>
  );
};

const CeremonialPoster: FC<{ featured: FeaturedArtifact }> = ({ featured }) => (
  <div
    className={[
      'relative isolate overflow-hidden rounded-md border border-[var(--border-stark)]',
      'bg-[var(--bg-panel)] p-6',
      'shadow-[0_30px_60px_-30px_color-mix(in_oklab,black_70%,transparent)]',
    ].join(' ')}
    aria-label="Ceremonial featured artifact"
  >
    <div className="flex items-start justify-between">
      <div className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
        BUREAU FEATURED ISSUE
      </div>
      <div className="text-[var(--accent-brass)]">
        <Seal size={56} className="opacity-95" />
      </div>
    </div>

    <div className="mt-5">
      <div className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
        CLASSIFICATION
      </div>
      <div className="mt-1 font-display text-[1.6rem] leading-tight tracking-tight text-[var(--text-strong)] sm:text-[1.8rem]">
        {featured.classification}
      </div>
      <div className="mt-1 font-display italic text-[var(--text-default)]">
        {featured.subjectTitle}
      </div>
    </div>

    <div className="mt-5 grid grid-cols-2 gap-4">
      <div>
        <div className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
          POWER SCORE
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span
            className="font-display text-[var(--text-strong)]"
            style={{
              fontSize: 'clamp(1.6rem, 5vw, 2rem)',
              lineHeight: 1,
              fontWeight: 500,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {featured.powerScore}
          </span>
          <span className="font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
            / 100
          </span>
        </div>
        <div className="mt-2 h-[5px] w-full overflow-hidden rounded-full bg-[var(--bg-panel-strong)]">
          <div
            className="h-full rounded-full bg-[var(--accent-brass)]"
            style={{ width: `${featured.powerScore}%` }}
          />
        </div>
      </div>
      <div>
        <div className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
          THREAT LEVEL
        </div>
        <div className="mt-2">
          <Chip tone={threatToTone(featured.threatLevel)}>{featured.threatLevel}</Chip>
        </div>
        <div className="mt-3 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
          CONFIDENCE · HIGH
        </div>
      </div>
    </div>

    <div className="mt-5 border-t border-[var(--border-subtle)] pt-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
          ACOUSTIC SAMPLE
        </span>
        <span className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
          CHANNEL · MONO
        </span>
      </div>
      <Waveform bars={64} />
    </div>
  </div>
);

function threatToTone(
  t: FeaturedArtifact['threatLevel'],
): 'green' | 'amber' | 'red' | 'cerulean' {
  switch (t) {
    case 'Green':
      return 'green';
    case 'Amber':
      return 'amber';
    case 'Red':
      return 'red';
    case 'Cerulean':
      return 'cerulean';
  }
}

const Arrow: FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
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
