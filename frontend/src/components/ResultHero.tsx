'use client';

import { motion } from 'framer-motion';
import type { FC } from 'react';
import { Chip } from '@/components/Chip';
import { ResultWaveform } from '@/components/ResultWaveform';
import { Seal } from '@/components/Seal';
import { useCountUp } from '@/lib/use-count-up';
import type { ResultVariant, ThreatLevel } from '@/lib/result-variants';

interface ResultHeroProps {
  variant: ResultVariant;
}

const EASE = [0.22, 0.61, 0.36, 1] as const;

/**
 * The payoff block: case-file ribbon, towering classification name, subject
 * subtitle, threat-level chip row, score counter, seal corner, waveform.
 *
 * Reveal sequence:
 *   ribbon → eyebrow labels → classification headline (display serif) →
 *   subject + summary → chip row → score (count-up) → seal + waveform.
 *
 * The headline is deliberately oversized (text-7xl on lg) so a vertical
 * 9:16 crop of just this section is a complete, screenshot-ready artifact.
 */
export const ResultHero: FC<ResultHeroProps> = ({ variant }) => {
  const score = useCountUp(variant.powerScore, 1100);
  const threatTone = threatToneFor(variant.threatLevel);

  return (
    <motion.section
      key={variant.id}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.45, ease: EASE }}
      className="relative mx-auto w-full max-w-7xl px-6 pt-8 lg:px-10 lg:pt-10"
    >
      {/* — Case-file ribbon — */}
      <div className="flex items-stretch overflow-hidden rounded-t-md border border-[var(--border-subtle)] bg-[var(--bg-panel-strong)]">
        <div className="flex flex-1 items-center gap-3 px-5 py-3">
          <span className="brand-rule h-px w-6 opacity-90" />
          <span className="font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
            CASE FILE
          </span>
          <span className="font-mono text-[0.72rem] tracking-wide-2 text-[var(--text-default)]">
            {variant.caseFile}
          </span>
        </div>
        <div className="hidden items-center gap-2 border-l border-[var(--border-subtle)] px-5 py-3 sm:flex">
          <Chip tone="brass">DOSSIER · vAlpha</Chip>
          {variant.warningBadge ? <Chip tone="amber">{variant.warningBadge}</Chip> : null}
        </div>
      </div>

      {/* — Card body — */}
      <div
        className={[
          'relative isolate overflow-hidden rounded-b-md border-x border-b border-[var(--border-stark)]',
          'bg-[var(--bg-panel)] shadow-[0_40px_80px_-30px_color-mix(in_oklab,black_65%,transparent)]',
          'before:absolute before:inset-0 before:-z-10 before:rounded-b-md',
          'before:bg-[radial-gradient(140%_140%_at_50%_-10%,color-mix(in_oklab,var(--accent-teal)_18%,transparent),transparent_60%)]',
        ].join(' ')}
      >
        {/* Diagonal "FOR PRIVATE USE" watermark — subtle, repeats once. */}
        <span
          aria-hidden="true"
          className={[
            'pointer-events-none absolute -right-10 top-12 select-none',
            'font-display text-[6rem] italic leading-none tracking-tight',
            'text-[var(--text-strong)] opacity-[0.025]',
            'rotate-[-12deg] sm:text-[9rem]',
          ].join(' ')}
        >
          PRIVATE
        </span>

        {/* corner crosshairs */}
        <Crosshair className="absolute -left-px -top-px" />
        <Crosshair className="absolute -right-px -top-px rotate-90" />
        <Crosshair className="absolute -left-px -bottom-px -rotate-90" />
        <Crosshair className="absolute -right-px -bottom-px rotate-180" />

        <div className="grid grid-cols-1 gap-10 px-6 py-8 lg:grid-cols-[1.4fr_1fr] lg:gap-14 lg:px-10 lg:py-12">
          {/* — Left column: headline + meta — */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } }}
            className="flex flex-col"
          >
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.55, ease: EASE }}
              className="flex items-center gap-3 font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-muted)]"
            >
              <span className="brand-rule h-px w-5 opacity-90" />
              <span>AGD-001 · CLASSIFICATION</span>
              <span className="rounded-sm border border-[var(--border-brass)] px-1.5 py-px text-[0.55rem] text-[var(--accent-brass)]">
                ISSUED
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              transition={{ duration: 0.6, ease: EASE }}
              className={[
                'mt-3 max-w-[16ch] font-display font-medium leading-[0.98] tracking-tight',
                'text-[var(--text-strong)] text-shadow-glow',
                'text-[2.8rem] sm:text-[3.6rem] md:text-[4.6rem] lg:text-[5.6rem]',
              ].join(' ')}
            >
              {variant.classification}
            </motion.h1>

            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.55, ease: EASE }}
              className="mt-4 font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-muted)]"
            >
              SUBJECT TITLE
            </motion.div>
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.55, ease: EASE }}
              className="font-display text-2xl italic tracking-tight text-[var(--text-default)] sm:text-[1.75rem]"
            >
              {variant.subjectTitle}
            </motion.div>

            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.55, ease: EASE }}
              className="mt-6 max-w-[52ch] text-[0.95rem] leading-relaxed text-[var(--text-default)]"
            >
              {variant.shortSummary}
            </motion.p>

            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.55, ease: EASE }}
              className="mt-7 flex flex-wrap items-center gap-2"
            >
              <Chip tone={threatTone}>THREAT · {variant.threatLevel.toUpperCase()}</Chip>
              <Chip tone="neutral">CONFIDENCE · {variant.confidenceLabel.toUpperCase()}</Chip>
              {variant.genre ? <Chip tone="brass">{variant.genre.toUpperCase()}</Chip> : null}
            </motion.div>

            {/* big score block */}
            <motion.div
              variants={fadeUp}
              transition={{ duration: 0.6, ease: EASE }}
              className="mt-9 flex items-end gap-6 border-t border-[var(--border-subtle)] pt-7"
            >
              <div className="flex flex-col">
                <span className="font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
                  AGD-101 · POWER SCORE
                </span>
                <div className="flex items-baseline gap-2 leading-none">
                  <span className="font-display text-[5rem] tracking-tight text-[var(--text-strong)] sm:text-[6rem]">
                    {String(score).padStart(2, '0')}
                  </span>
                  <span className="font-mono text-xs uppercase tracking-wide-2 text-[var(--text-muted)]">
                    / 100
                  </span>
                </div>
                <div className="mt-2 h-[6px] w-48 overflow-hidden rounded-full bg-[var(--bg-panel-strong)] sm:w-64">
                  <motion.div
                    key={variant.id + '-score-bar'}
                    initial={{ width: 0 }}
                    animate={{ width: `${variant.powerScore}%` }}
                    transition={{ duration: 1.1, ease: EASE, delay: 0.2 }}
                    className="h-full rounded-full bg-[var(--accent-brass)]"
                  />
                </div>
              </div>
              <div className="hidden flex-col items-end gap-1 sm:flex">
                <span className="font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
                  AGD-102 · DURATION
                </span>
                <span className="font-display text-3xl tracking-tight text-[var(--text-strong)]">
                  {(variant.durationMs / 1000).toFixed(2)}
                  <span className="ml-1 font-mono text-xs uppercase tracking-wide-2 text-[var(--text-muted)]">
                    s
                  </span>
                </span>
              </div>
            </motion.div>
          </motion.div>

          {/* — Right column: seal + waveform + hash strip — */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.55, ease: EASE, delay: 0.35 }}
            className="flex flex-col gap-6"
          >
            <div className="flex items-center justify-between rounded-md border border-[var(--border-subtle)] bg-[var(--bg-panel-strong)] px-5 py-4">
              <div>
                <div className="font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
                  BUREAU SEAL
                </div>
                <div className="font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
                  CERTIFIED · STATION OPS-04
                </div>
              </div>
              <div className="relative">
                <Seal size={100} className="text-[var(--accent-brass)] opacity-95" />
                <span className="absolute -bottom-1 right-0 rotate-3 rounded-sm border border-[var(--border-brass)] bg-[var(--bg-panel)] px-2 py-px font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
                  SEALED
                </span>
              </div>
            </div>

            <ResultWaveform seed={variant.waveformSeed} durationMs={variant.durationMs} />

            <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-panel-strong)] px-5 py-4">
              <div className="font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
                AGD-501 · ACOUSTIC SIGNATURE HASH
              </div>
              <div className="mt-1 break-all font-mono text-[0.85rem] tracking-wide-2 text-[var(--text-strong)]">
                {variant.reportHash}
              </div>
              <div className="mt-3 flex items-center justify-between font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
                <span>SHA · SERVER-CONTROLLED</span>
                <span>v0.7 · ALPHA</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};

const Crosshair: FC<{ className?: string }> = ({ className }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    aria-hidden="true"
    className={`text-[var(--accent-brass)] opacity-80 ${className ?? ''}`}
  >
    <path d="M0 0 L8 0 L8 1 L1 1 L1 8 L0 8 Z" fill="currentColor" />
  </svg>
);

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
};

function threatToneFor(
  level: ThreatLevel,
): 'green' | 'amber' | 'red' | 'cerulean' {
  switch (level) {
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
