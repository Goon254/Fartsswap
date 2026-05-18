'use client';

import { motion } from 'framer-motion';
import type { FC } from 'react';
import { Chip } from '@/components/Chip';
import { Seal } from '@/components/Seal';
import { Waveform } from '@/components/Waveform';
import { transitionBrand } from '@/lib/motion';
import type { PreviewReport } from '@/lib/data';

interface ReportPreviewCardProps {
  report: PreviewReport;
}

/**
 * The hero's right-column visual.
 *
 * Reads like a classified diagnostic dossier: case-file ribbon at the top,
 * paired metric/label rows, a live waveform, the Bureau seal corner, and
 * a "no medical value" microcopy footer.
 *
 * Hover: a 6px lift + a tiny 3D rotation. Inside: an animated scan-line that
 * sweeps the card every ~9s. Both effects respect prefers-reduced-motion via
 * globals.css.
 */
export const ReportPreviewCard: FC<ReportPreviewCardProps> = ({ report }) => {
  const threatTone =
    report.threatLevel === 'Red'
      ? 'red'
      : report.threatLevel === 'Amber'
        ? 'amber'
        : report.threatLevel === 'Green'
          ? 'green'
          : 'cerulean';

  return (
    <motion.article
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...transitionBrand, delay: 0.55 }}
      whileHover={{ y: -6, rotateX: 1.4, rotateY: -1.4 }}
      style={{ transformPerspective: 1200 }}
      className={[
        'group/card relative isolate overflow-hidden rounded-lg',
        'border border-[var(--border-stark)] bg-[var(--bg-panel)]',
        'shadow-[0_30px_60px_-20px_color-mix(in_oklab,black_60%,transparent)]',
        'before:absolute before:inset-0 before:-z-10 before:rounded-lg',
        'before:bg-[radial-gradient(120%_120%_at_50%_-10%,color-mix(in_oklab,var(--accent-teal)_18%,transparent),transparent_60%)]',
      ].join(' ')}
    >
      {/* — Case-file ribbon — */}
      <div className="flex items-stretch border-b border-[var(--border-subtle)] bg-[var(--bg-panel-strong)]">
        <div className="flex flex-1 items-center gap-3 px-5 py-3">
          <span className="brand-rule h-px w-6 opacity-90" />
          <span className="font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
            CASE FILE
          </span>
          <span className="font-mono text-[0.72rem] tracking-wide-2 text-[var(--text-default)]">
            {report.caseFile}
          </span>
        </div>
        <div className="hidden items-center gap-2 border-l border-[var(--border-subtle)] px-5 py-3 sm:flex">
          <Chip tone="brass">DOSSIER · vAlpha</Chip>
        </div>
      </div>

      {/* — Header / titles — */}
      <div className="relative grid grid-cols-[1fr_auto] gap-6 px-6 pb-4 pt-6 sm:px-7">
        <div className="min-w-0">
          <div className="font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
            CLASSIFICATION
          </div>
          <h2 className="mt-1 font-display text-2xl leading-tight tracking-tight text-[var(--text-strong)] sm:text-3xl">
            {report.classification}
          </h2>
          <div className="mt-3 font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
            SUBJECT TITLE
          </div>
          <div className="mt-1 truncate text-base font-medium text-[var(--text-default)]">
            {report.fartName}
          </div>
        </div>
        <div className="relative flex items-start justify-end pt-1">
          <Seal size={88} className="text-[var(--accent-brass)] opacity-90" />
          <span className="absolute -bottom-1 right-0 rotate-3 rounded-sm border border-[var(--border-brass)] px-2 py-px font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
            SEALED
          </span>
        </div>
      </div>

      {/* — Stats grid — */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-5 border-t border-[var(--border-subtle)] px-6 py-5 sm:grid-cols-3 sm:px-7">
        <Stat label="POWER SCORE">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl tracking-tight text-[var(--text-strong)]">
              {report.powerScore}
            </span>
            <span className="font-mono text-[0.65rem] uppercase tracking-wide-2 text-[var(--text-muted)]">
              / 100
            </span>
          </div>
          <div className="mt-2 h-[6px] w-full overflow-hidden rounded-full bg-[var(--bg-panel-strong)]">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${report.powerScore}%` }}
              transition={{ ...transitionBrand, delay: 1.0 }}
              className="h-full rounded-full bg-[var(--accent-brass)]"
            />
          </div>
        </Stat>
        <Stat label="DURATION">
          <span className="font-display text-2xl tracking-tight text-[var(--text-strong)]">
            {(report.durationMs / 1000).toFixed(2)}
            <span className="ml-1 font-mono text-[0.65rem] uppercase tracking-wide-2 text-[var(--text-muted)]">
              s
            </span>
          </span>
        </Stat>
        <Stat label="THREAT LEVEL">
          <div className="mt-0.5">
            <Chip tone={threatTone}>{report.threatLevel}</Chip>
          </div>
          <div className="mt-1 font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
            CONFIDENCE · {report.confidenceLabel}
          </div>
        </Stat>
        <Stat label="EMOTIONAL TONE" className="col-span-2 sm:col-span-1">
          <span className="text-sm leading-snug text-[var(--text-default)]">
            {report.emotionalTone}
          </span>
        </Stat>
        <Stat label="PROBABLE CAUSE" className="col-span-2 sm:col-span-2">
          <span className="text-sm leading-snug text-[var(--text-default)]">
            {report.probableCause}
          </span>
        </Stat>
        <Stat label="CINEMATIC PARALLEL" className="col-span-2 sm:col-span-3">
          <span className="text-sm leading-snug text-[var(--text-default)]">
            {report.cinematicParallel}
          </span>
        </Stat>
      </div>

      {/* — Waveform — */}
      <div className="border-t border-[var(--border-subtle)] px-6 pb-5 pt-4 sm:px-7">
        <div className="mb-2 flex items-center justify-between">
          <div className="font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
            ACOUSTIC SAMPLE
          </div>
          <div className="font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
            CHANNEL · MONO
          </div>
        </div>
        <Waveform bars={64} />
      </div>

      {/* — Footer ribbon — */}
      <div className="flex flex-col gap-2 border-t border-[var(--border-subtle)] bg-[var(--bg-panel-strong)] px-6 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-7">
        <div className="font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
          HASH · <span className="text-[var(--text-default)]">{report.reportHash}</span>
        </div>
        <div className="font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
          ISSUED · <span className="text-[var(--text-default)]">{formatIso(report.issuedAtIso)}</span>
        </div>
      </div>

      {/* — Animated scan-line — */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[160%] -translate-y-full bg-gradient-to-b from-transparent via-[color-mix(in_oklab,var(--accent-teal)_14%,transparent)] to-transparent animate-scanline"
      />

      {/* — Corner crosshairs — */}
      <Crosshair className="absolute -left-px -top-px" />
      <Crosshair className="absolute -right-px -top-px rotate-90" />
      <Crosshair className="absolute -left-px -bottom-px -rotate-90" />
      <Crosshair className="absolute -right-px -bottom-px rotate-180" />
    </motion.article>
  );
};

const Stat: FC<{ label: string; children: React.ReactNode; className?: string }> = ({
  label,
  children,
  className,
}) => (
  <div className={className}>
    <div className="font-mono text-[0.58rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
      {label}
    </div>
    <div className="mt-1">{children}</div>
  </div>
);

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

function formatIso(iso: string): string {
  // Render in UTC so SSR and CSR agree regardless of the browser timezone —
  // also matches the dossier-style "issued at UTC" feel.
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`
  );
}
