'use client';

import { motion } from 'framer-motion';
import type { FC } from 'react';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { ReportPreviewCard } from '@/components/ReportPreviewCard';
import { track } from '@/lib/analytics';
import { fadeUp, staggerParent, transitionBrand } from '@/lib/motion';
import { HERO_INFO_STRIP, SAMPLE_REPORT } from '@/lib/data';

/**
 * Hero composition:
 *   - Two columns at >=lg: copy (left) + report dossier (right).
 *   - Stacked at <lg: copy on top, card below.
 *
 * Sequence reveal:
 *   eyebrow chips → headline → support → CTAs → info strip → card (delayed
 *   inside ReportPreviewCard so it lands last like the lab equipment booting
 *   up after the operator panel).
 */
export const Hero: FC = () => (
  <section className="relative">
    <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-12 px-6 pb-24 pt-12 sm:pt-20 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:px-10 lg:pb-32">
      <motion.div
        variants={staggerParent}
        initial="hidden"
        animate="visible"
        className="flex flex-col"
      >
        {/* Eyebrow ribbon */}
        <motion.div variants={fadeUp} transition={transitionBrand} className="flex flex-wrap items-center gap-3">
          <Chip tone="brass">CLASSIFIED · ACOUSTIC DIAGNOSTICS</Chip>
          <Chip tone="teal" withDot>
            CASE FILE OPEN
          </Chip>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={fadeUp}
          transition={transitionBrand}
          className={[
            'mt-7 max-w-[20ch] font-display text-[2.6rem] font-medium leading-[1.02] tracking-tight',
            'text-[var(--text-strong)] text-shadow-glow',
            'sm:text-[3.4rem] md:text-[3.9rem] lg:max-w-[18ch] lg:text-[4.2rem] xl:text-[4.8rem]',
          ].join(' ')}
        >
          Record a fart. Get a{' '}
          <span className="italic text-[var(--accent-brass)]">funny AI dossier</span>. Challenge
          anyone.
        </motion.h1>

        {/* Support */}
        <motion.p
          variants={fadeUp}
          transition={transitionBrand}
          className="mt-7 max-w-[48ch] text-base leading-relaxed text-[var(--text-default)] sm:text-lg"
        >
          Ten-second capture, instant Bureau classification, private replay on your report, challenge
          links with a winner/loser verdict, and an opt-in moderated public feed. No account
          required.
        </motion.p>

        {/* CTAs — both link into the multistep /analyze flow; the path query
            tells the flow which step to land on first. onClick fires before
            navigation so the analytics event is recorded reliably. */}
        <motion.div
          variants={fadeUp}
          transition={transitionBrand}
          className="mt-9 flex flex-wrap items-center gap-3"
        >
          <Button
            variant="primary"
            href="/analyze?path=record"
            onClick={() => track('landing_cta_click', { cta: 'analyze' })}
            trailing={<Arrow />}
          >
            Record my fart
          </Button>
          <Button
            variant="secondary"
            href="/analyze?path=fake"
            onClick={() => track('landing_cta_click', { cta: 'fake' })}
          >
            Try demo (no mic)
          </Button>
        </motion.div>

        <motion.p
          variants={fadeUp}
          transition={transitionBrand}
          className="mt-4 font-mono text-[0.62rem] uppercase tracking-wide-3 text-[var(--text-muted)]"
        >
          Anonymous by default · Private unless you post · No signup
        </motion.p>

        <motion.p variants={fadeUp} transition={transitionBrand} className="mt-3">
          <a
            href="/feed"
            className="font-mono text-[0.65rem] uppercase tracking-wide-2 text-[var(--accent-brass)] underline-offset-2 hover:underline"
          >
            Browse the public feed →
          </a>
        </motion.p>

        {/* Lower info strip */}
        <motion.div
          variants={fadeUp}
          transition={transitionBrand}
          className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-md border border-[var(--border-subtle)] bg-[var(--border-subtle)] sm:grid-cols-3"
        >
          {HERO_INFO_STRIP.map((item) => (
            <div
              key={item.label}
              className="bg-[var(--bg-panel)] px-4 py-4"
            >
              <div className="font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
                {item.label}
              </div>
              <div className="mt-1 text-sm text-[var(--text-default)]">{item.detail}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* — Right column / dossier — */}
      <div className="relative">
        <DossierFrame>
          <ReportPreviewCard report={SAMPLE_REPORT} />
        </DossierFrame>
      </div>
    </div>
  </section>
);

/**
 * Light scaffolding around the report card — a corner ruler + a "specimen
 * label" tab that reinforces the laboratory framing without competing with
 * the card itself.
 */
const DossierFrame: FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="relative">
    <div className="absolute -inset-x-4 -top-3 z-0 hidden h-8 items-center justify-between font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)] sm:flex">
      <span>SPECIMEN ID · BAG-2026-04412</span>
      <span>VIEW · DOSSIER / vAlpha</span>
    </div>
    <div className="absolute -left-3 top-6 z-0 hidden h-32 w-px bg-[var(--border-subtle)] sm:block" />
    <div className="absolute -right-3 top-6 z-0 hidden h-32 w-px bg-[var(--border-subtle)] sm:block" />
    {children}
  </div>
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
