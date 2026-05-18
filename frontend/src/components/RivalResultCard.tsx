'use client';

import { motion } from 'framer-motion';
import type { FC } from 'react';
import { Chip } from '@/components/Chip';
import { Seal } from '@/components/Seal';
import { Waveform } from '@/components/Waveform';
import type { Challenge } from '@/lib/challenge';
import { getVariantById, type ThreatLevel } from '@/lib/result-variants';

interface RivalResultCardProps {
  challenge: Challenge;
}

const EASE = [0.22, 0.61, 0.36, 1] as const;

/**
 * Compact rival summary used on the /challenge page.
 *
 * Smaller and quieter than the full /report dossier — the page's centre of
 * gravity is the dispute notice + the score-to-beat, not the rival's
 * artifact. We surface only what the recipient needs to size up the
 * challenge: classification, score, threat, hash, mini waveform, plus a
 * small "ARTIFACT IN DISPUTE" stamp to reinforce the framing.
 */
export const RivalResultCard: FC<RivalResultCardProps> = ({ challenge }) => {
  const variant = getVariantById(challenge.sourceVariantId);
  const threatTone = THREAT_TONES[variant.threatLevel];

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE, delay: 0.15 }}
      className={[
        'group/rival relative isolate overflow-hidden rounded-md',
        'border border-[var(--border-stark)] bg-[var(--bg-panel)]',
        'shadow-[0_20px_50px_-30px_color-mix(in_oklab,black_65%,transparent)]',
      ].join(' ')}
    >
      {/* — Filed-under-dispute ribbon — */}
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-[var(--bg-panel-strong)] px-5 py-3">
        <div className="flex items-center gap-3 font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
          <span aria-hidden="true" className="brand-rule h-px w-5 opacity-90" />
          <span>ARTIFACT IN DISPUTE</span>
        </div>
        <Chip tone="brass">CASE · {summariseId(challenge.challengeId)}</Chip>
      </div>

      {/* — Body — */}
      <div className="grid grid-cols-1 gap-6 px-6 py-5 sm:grid-cols-[1.4fr_1fr]">
        <div className="min-w-0">
          <div className="font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
            CLASSIFICATION
          </div>
          <h2 className="mt-1 truncate font-display text-2xl leading-tight tracking-tight text-[var(--text-strong)] sm:text-3xl">
            {variant.classification}
          </h2>

          <div className="mt-3 font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
            SUBJECT
          </div>
          <div className="truncate text-base italic text-[var(--text-default)]">
            {variant.subjectTitle}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Chip tone={threatTone}>THREAT · {variant.threatLevel.toUpperCase()}</Chip>
            <Chip tone="neutral">CONFIDENCE · {variant.confidenceLabel.toUpperCase()}</Chip>
            {variant.genre ? <Chip tone="brass">{variant.genre.toUpperCase()}</Chip> : null}
          </div>
        </div>

        <div className="flex flex-col items-start gap-3 sm:items-end">
          <div className="font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
            POWER SCORE
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-5xl leading-none tracking-tight text-[var(--text-strong)]">
              {String(challenge.sourceScore).padStart(2, '0')}
            </span>
            <span className="font-mono text-[0.6rem] uppercase tracking-wide-2 text-[var(--text-muted)]">
              / 100
            </span>
          </div>
          <div className="relative">
            <Seal size={72} className="text-[var(--accent-brass)] opacity-90" />
            <span className="absolute -bottom-1 right-0 rotate-3 rounded-sm border border-[var(--border-brass)] bg-[var(--bg-panel)] px-1.5 py-px font-mono text-[0.5rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
              FILED
            </span>
          </div>
        </div>
      </div>

      {/* — Waveform — */}
      <div className="border-t border-[var(--border-subtle)] px-6 pb-4 pt-3">
        <div className="mb-2 flex items-center justify-between font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
          <span>AGD-401 · SIGNAL TRACE</span>
          <span>{(variant.durationMs / 1000).toFixed(2)}s · MONO</span>
        </div>
        <Waveform bars={56} seed={variant.waveformSeed} />
      </div>

      {/* — Footer hash + issued strip — */}
      <div className="flex flex-col gap-1 border-t border-[var(--border-subtle)] bg-[var(--bg-panel-strong)] px-6 py-3 text-[0.6rem] sm:flex-row sm:items-center sm:justify-between">
        <div className="font-mono uppercase tracking-wide-3 text-[var(--text-muted)]">
          HASH · <span className="text-[var(--text-default)]">{variant.reportHash}</span>
        </div>
        <div className="font-mono uppercase tracking-wide-3 text-[var(--text-muted)]">
          ISSUED · <span className="text-[var(--text-default)]">{formatIsoShort(challenge.issuedAt)}</span>
        </div>
      </div>
    </motion.article>
  );
};

const THREAT_TONES: Record<ThreatLevel, 'green' | 'amber' | 'red' | 'cerulean'> = {
  Green: 'green',
  Amber: 'amber',
  Red: 'red',
  Cerulean: 'cerulean',
};

function formatIsoShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}

/**
 * The challenge id is long (ch_3f9a2b1c…); we surface just the first four
 * hex chars upper-cased so it reads as a docket reference in chips.
 */
function summariseId(id: string): string {
  const tail = id.replace(/^ch_/, '').slice(0, 4).toUpperCase();
  return tail.length > 0 ? `DKT-${tail}` : 'DKT-0000';
}

