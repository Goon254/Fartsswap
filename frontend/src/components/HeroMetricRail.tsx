'use client';

import { motion } from 'framer-motion';
import type { FC } from 'react';
import { Chip } from '@/components/Chip';
import type { HeadlineMetric } from '@/lib/methane-index';

interface HeroMetricRailProps {
  metrics: readonly HeadlineMetric[];
}

const EASE = [0.22, 0.61, 0.36, 1] as const;

/**
 * Five-up (responsive) metric rail beneath the bulletin masthead.
 *
 * Each tile is a tight, editorial summary cell: small eyebrow code,
 * display-size value, a tonal chip on the right, and an optional
 * single-line hint below. Each tile collapses cleanly on narrow
 * viewports so the bulletin remains readable on a phone.
 */
export const HeroMetricRail: FC<HeroMetricRailProps> = ({ metrics }) => (
  <motion.section
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: EASE }}
    className="mx-auto w-full max-w-7xl px-6 lg:px-10"
  >
    <header className="mb-6 flex flex-wrap items-center gap-3 font-mono text-[0.65rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
      <span aria-hidden="true" className="brand-rule h-px w-8 opacity-90" />
      <span className="rounded-sm border border-[var(--border-brass)] px-1.5 py-px text-[0.6rem]">
        §I
      </span>
      <span>HEADLINE METRICS · INDEX BULLETIN</span>
      <span aria-hidden="true" className="brand-rule h-px flex-1 opacity-40" />
    </header>

    <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-[var(--border-subtle)] bg-[var(--border-subtle)] sm:grid-cols-2 lg:grid-cols-5">
      {metrics.map((m, i) => (
        <li
          key={m.id}
          className="flex flex-col gap-3 bg-[var(--bg-panel)] px-5 py-5"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
              {`№ ${String(i + 1).padStart(2, '0')} · ${m.label}`}
            </span>
            <Chip tone={m.tone ?? 'neutral'}>{shortToneLabel(m.tone)}</Chip>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className="font-display tracking-tight text-[var(--text-strong)]"
              style={{
                fontSize: 'clamp(1.6rem, 3.4vw, 2.2rem)',
                lineHeight: 1.0,
                fontWeight: 500,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {m.value}
            </span>
            {m.unit ? (
              <span className="font-mono text-[0.65rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
                {m.unit}
              </span>
            ) : null}
          </div>
          {m.trend ? (
            <TrendStrip direction={m.trend.direction} delta={m.trend.delta} />
          ) : null}
          {m.hint ? (
            <p className="font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
              {m.hint}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  </motion.section>
);

function shortToneLabel(tone: HeadlineMetric['tone']): string {
  switch (tone) {
    case 'brass':
      return 'PRIMARY';
    case 'amber':
      return 'ELEVATED';
    case 'green':
      return 'STABLE';
    case 'red':
      return 'ACUTE';
    case 'cerulean':
      return 'RARE';
    default:
      return 'NOTED';
  }
}

const TrendStrip: FC<{ direction: 'up' | 'down' | 'flat'; delta: string }> = ({
  direction,
  delta,
}) => {
  const tone =
    direction === 'up'
      ? 'text-[var(--color-alert-green)]'
      : direction === 'down'
        ? 'text-[var(--color-alert-red)]'
        : 'text-[var(--text-muted)]';
  return (
    <div className={`flex items-center gap-2 font-mono text-[0.6rem] uppercase tracking-wide-3 ${tone}`}>
      <span aria-hidden="true">
        {direction === 'up' ? '\u25B2' : direction === 'down' ? '\u25BC' : '\u25AC'}
      </span>
      <span className="tabular-nums">{delta}</span>
    </div>
  );
};
