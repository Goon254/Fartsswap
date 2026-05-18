'use client';

import { motion } from 'framer-motion';
import type { FC } from 'react';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';

interface LaunchHeroProps {
  /** Anchor target for the in-page early-access form. */
  earlyAccessAnchor: string;
  /** Href for the "release one specimen" sample dossier link. */
  sampleHref: string;
  /** Fires when the primary CTA (request early access) is clicked. */
  onRequestEarlyAccessClick: () => void;
  /** Fires when the secondary CTA (sample dossier) is clicked. */
  onSampleReportClick: () => void;
}

const EASE = [0.22, 0.61, 0.36, 1] as const;

/**
 * Launch-mode hero.
 *
 * Replaces the live-product hero on the homepage when LAUNCH_MODE is on.
 * Voice is dialled up from "lab in operation" to "bureau preparing for
 * public release":
 *
 *   eyebrow:   STATION OPS-04 · MMXXVI · PRE-RELEASE BULLETIN
 *   headline:  The world's first AI-powered fart diagnostic lab is
 *              opening to the public.
 *   support:   Record a fart. Receive a clinically unnecessary report.
 *              Share responsibly. ...
 *   primary:   Request early access  →
 *   secondary: Release one specimen  →
 *
 * The CTAs route by hash + by /report respectively; both fire analytics
 * before navigation so attribution survives a slow client paint.
 */
export const LaunchHero: FC<LaunchHeroProps> = ({
  earlyAccessAnchor,
  sampleHref,
  onRequestEarlyAccessClick,
  onSampleReportClick,
}) => (
  <section className="relative">
    <div className="mx-auto w-full max-w-7xl px-6 pb-16 pt-12 sm:pt-20 lg:px-10 lg:pb-24">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="flex flex-col items-start"
      >
        <div className="flex flex-wrap items-center gap-3">
          <Chip tone="brass">PRE-RELEASE BULLETIN</Chip>
          <Chip tone="amber" withDot>
            STATION OPS-04 · MMXXVI
          </Chip>
          <Chip tone="neutral">FILED UNDER §0.1</Chip>
        </div>

        <h1
          className={[
            'mt-7 max-w-[20ch] font-display font-medium leading-[1.02] tracking-tight',
            'text-[var(--text-strong)] text-shadow-glow',
            'text-[2.6rem] sm:text-[3.4rem] md:text-[4rem] lg:max-w-[18ch] lg:text-[4.6rem] xl:text-[5.2rem]',
          ].join(' ')}
        >
          The world{'\u2019'}s first{' '}
          <span className="italic text-[var(--accent-brass)]">AI-powered</span> fart diagnostic lab
          is opening to the public.
        </h1>

        <p className="mt-7 max-w-[58ch] text-base leading-relaxed text-[var(--text-default)] sm:text-lg">
          Record a fart. Receive a clinically unnecessary report. Share responsibly. The Bureau is
          accepting founding designations ahead of general public filing under §0.1 of the Release
          Provision.
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Button
            variant="primary"
            href={earlyAccessAnchor}
            onClick={onRequestEarlyAccessClick}
            trailing={<Arrow />}
          >
            Request early access
          </Button>
          <Button
            variant="secondary"
            href={sampleHref}
            onClick={onSampleReportClick}
            trailing={<Arrow />}
          >
            Release one specimen
          </Button>
        </div>

        <p className="mt-4 font-mono text-[0.62rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
          No medical value · Immense cultural value · Public filing line opens this season
        </p>
      </motion.div>
    </div>
  </section>
);

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
