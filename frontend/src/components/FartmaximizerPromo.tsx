'use client';

import { motion } from 'framer-motion';
import type { FC } from 'react';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { track } from '@/lib/analytics';
import { fadeUp, transitionBrand } from '@/lib/motion';

/**
 * Landing-page callout routing visitors to `/fartmaximizer`.
 */
export const FartmaximizerPromo: FC = () => (
  <section className="relative border-t border-[var(--border-subtle)]">
    <div className="mx-auto w-full max-w-7xl px-6 py-14 lg:px-10 lg:py-20">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.35 }}
        transition={transitionBrand}
        className={[
          'relative overflow-hidden rounded-md border border-[var(--border-brass)]',
          'bg-[color-mix(in_oklab,var(--accent-brass)_6%,var(--bg-panel))]',
          'p-6 sm:p-8 lg:p-10',
        ].join(' ')}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[var(--glow-brass)] blur-3xl"
        />
        <div className="relative grid grid-cols-1 gap-8 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-12">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Chip tone="brass">Community research</Chip>
              <Chip tone="teal" withDot>
                Live rankings
              </Chip>
            </div>
            <h2 className="mt-5 font-display text-2xl leading-tight tracking-tight text-[var(--text-strong)] sm:text-3xl lg:text-4xl">
              Enter the Fartmaximizer™ Lab
            </h2>
            <p className="mt-4 max-w-[50ch] text-sm leading-relaxed text-[var(--text-default)] sm:text-base">
              Vote on the most toxic meal combinations field agents have ever filed. DEFCON 1
              podium, tiered threat bands, and community submissions — no microphone required.
            </p>
            <p className="mt-3 font-mono text-[0.62rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
              Directive AGD-441 · Meal Matrix · Open attestations
            </p>
          </div>
          <div className="flex flex-col items-stretch gap-3 sm:items-start lg:items-end">
            <Button
              variant="primary"
              href="/fartmaximizer"
              onClick={() => track('landing_fartmaximizer_click', { location: 'promo_primary' })}
              trailing={<Arrow />}
              className="w-full justify-center sm:w-auto"
            >
              Open Fartmaximizer Lab
            </Button>
            <span className="text-center font-mono text-[0.58rem] uppercase tracking-wide-3 text-[var(--text-muted)] lg:text-right">
              20 ranked combinations · Vote · Submit
            </span>
          </div>
        </div>
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
