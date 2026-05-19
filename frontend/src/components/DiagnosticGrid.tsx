'use client';

import { motion } from 'framer-motion';
import type { FC, ReactNode } from 'react';
import { Chip } from '@/components/Chip';
import { Wordmark } from '@/components/Wordmark';
import type { ResultVariant, ThreatLevel } from '@/lib/result-variants';

interface DiagnosticGridProps {
  variant: ResultVariant;
}

const EASE = [0.22, 0.61, 0.36, 1] as const;

/**
 * Dense, ceremonial diagnostic grid.
 *
 * Layout idea: every module is a numbered "FIELD" with a brass code
 * (AGD-XXX), a small label, and a value. The grid uses 1px hairline
 * dividers — the cards share their borders so the whole thing reads as a
 * single ruled form rather than separate floating cards.
 *
 * Reveal: staggered fade-up using whileInView so it animates the first
 * time the section enters the viewport, then never again per variant.
 * Variant changes re-key the parent (in ReportResultClient) so the stagger
 * re-runs naturally.
 */
export const DiagnosticGrid: FC<DiagnosticGridProps> = ({ variant }) => {
  const threatTone = threatToneFor(variant.threatLevel);
  const sec = (variant.durationMs / 1000).toFixed(2);

  return (
    <motion.section
      key={variant.id + '-grid'}
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } } }}
      className="relative mx-auto w-full max-w-7xl px-6 py-12 lg:px-10 lg:py-16"
    >
      {/* — Section eyebrow — */}
      <motion.div
        variants={fadeUp}
        transition={{ duration: 0.45, ease: EASE }}
        className="mb-6 flex items-center gap-3"
      >
        <span className="brand-rule h-px w-8 opacity-90" />
        <span className="rounded-sm border border-[var(--border-brass)] px-1.5 py-px font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
          §02
        </span>
        <span className="font-mono text-[0.65rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
          STRUCTURED DIAGNOSTIC MODULES
        </span>
        <span aria-hidden="true" className="brand-rule h-px flex-1 opacity-40" />
        <span className="hidden font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)] md:inline">
          12 FIELDS · ALL CLINICALLY UNNECESSARY
        </span>
      </motion.div>

      <div className="overflow-hidden rounded-md border border-[var(--border-subtle)]">
        {/* row 1 — emotional tone | probable cause | threat level */}
        <div className="grid grid-cols-1 gap-px bg-[var(--border-subtle)] md:grid-cols-[1.1fr_1.6fr_0.9fr]">
          <Module code="AGD-201" label="EMOTIONAL TONE">
            <ValueLine value={variant.emotionalTone} />
          </Module>
          <Module code="AGD-202" label="PROBABLE CAUSE">
            <ValueLine value={variant.probableCause} />
          </Module>
          <Module code="AGD-203" label="THREAT LEVEL" align="end">
            <div className="mt-1">
              <Chip tone={threatTone}>{variant.threatLevel.toUpperCase()}</Chip>
            </div>
            <div className="mt-2 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
              CONFIDENCE · {variant.confidenceLabel.toUpperCase()}
            </div>
          </Module>
        </div>

        {/* row 2 — cinematic parallel (wide) | genre (narrow) */}
        <div className="grid grid-cols-1 gap-px bg-[var(--border-subtle)] md:grid-cols-[2fr_1fr]">
          <Module code="AGD-204" label="CINEMATIC PARALLEL">
            <ValueLine value={variant.cinematicParallel} italic />
          </Module>
          <Module code="AGD-205" label="GENRE TAG">
            <ValueLine value={variant.genre ?? 'Unclassified'} />
            {variant.warningBadge ? (
              <div className="mt-2 inline-flex">
                <Chip tone="amber">{variant.warningBadge}</Chip>
              </div>
            ) : null}
          </Module>
        </div>

        {/* row 3 — power score | duration | hash */}
        <div className="grid grid-cols-1 gap-px bg-[var(--border-subtle)] md:grid-cols-[1fr_1fr_1.6fr]">
          <Module code="AGD-101" label="POWER SCORE">
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-3xl tracking-tight text-[var(--text-strong)]">
                {variant.powerScore}
              </span>
              <span className="font-mono text-[0.6rem] uppercase tracking-wide-2 text-[var(--text-muted)]">
                / 100
              </span>
            </div>
            <div className="mt-2 h-[5px] w-full overflow-hidden rounded-full bg-[var(--bg-panel-strong)]">
              <motion.div
                key={variant.id + '-grid-bar'}
                initial={{ width: 0 }}
                animate={{ width: `${variant.powerScore}%` }}
                transition={{ duration: 1.0, ease: EASE, delay: 0.4 }}
                className="h-full rounded-full bg-[var(--accent-brass)]"
              />
            </div>
          </Module>
          <Module code="AGD-102" label="DURATION">
            <div className="flex items-baseline gap-1.5">
              <span className="font-display text-3xl tracking-tight text-[var(--text-strong)]">
                {sec}
              </span>
              <span className="font-mono text-[0.6rem] uppercase tracking-wide-2 text-[var(--text-muted)]">
                s
              </span>
            </div>
            <div className="mt-2 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
              CHANNEL · MONO · 44.1 kHz
            </div>
          </Module>
          <Module code="AGD-501" label="ACOUSTIC SIGNATURE HASH">
            <span className="break-all font-mono text-[0.78rem] tracking-wide-2 text-[var(--text-strong)]">
              {variant.reportHash}
            </span>
            <div className="mt-2 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
              SHA · SERVER-CONTROLLED
            </div>
          </Module>
        </div>

        {/* watermark zone */}
        <div className="grid grid-cols-1 gap-px bg-[var(--border-subtle)]">
          <div className="flex flex-col gap-3 bg-[var(--bg-panel-strong)] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Wordmark size="sm" />
              <span aria-hidden="true" className="hidden h-4 w-px bg-[var(--border-stark)] sm:inline-block" />
              <span className="font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
                Generated by Fartsswap.com · Parody diagnostic. No medical value.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Chip tone="brass">ISSUED · {formatIsoShort(variant.issuedAtIso)}</Chip>
              <Chip tone="neutral">CASE · {variant.caseFile}</Chip>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

interface ModuleProps {
  code: string;
  label: string;
  align?: 'start' | 'end';
  children: ReactNode;
}

const Module: FC<ModuleProps> = ({ code, label, align = 'start', children }) => (
  <motion.div
    variants={fadeUp}
    transition={{ duration: 0.45, ease: EASE }}
    className="group/module relative flex flex-col gap-2 bg-[var(--bg-panel)] px-5 py-5 sm:px-6"
  >
    {/* top-rule appears on hover for liveliness */}
    <span
      aria-hidden="true"
      className="absolute inset-x-0 top-0 h-px scale-x-0 origin-left bg-[var(--accent-brass)] opacity-80 transition-transform duration-500 group-hover/module:scale-x-100"
    />
    <div
      className={[
        'flex items-center gap-2 font-mono text-[0.55rem] uppercase tracking-wide-3',
        align === 'end' ? 'justify-end' : '',
      ].join(' ')}
    >
      <span className="text-[var(--accent-brass)]">{code}</span>
      <span aria-hidden="true" className="h-2.5 w-px bg-[var(--border-subtle)]" />
      <span className="text-[var(--text-muted)]">{label}</span>
    </div>
    <div>{children}</div>
  </motion.div>
);

const ValueLine: FC<{ value: string; italic?: boolean }> = ({ value, italic }) => (
  <span
    className={[
      'block text-[1rem] leading-snug text-[var(--text-default)]',
      italic ? 'font-display italic text-[var(--text-strong)]' : '',
    ].join(' ')}
  >
    {value}
  </span>
);

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

function threatToneFor(level: ThreatLevel): 'green' | 'amber' | 'red' | 'cerulean' {
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

function formatIsoShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}
