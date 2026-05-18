'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useMemo, type FC } from 'react';
import { Chip } from '@/components/Chip';
import { CopyButton } from '@/components/CopyButton';
import { Seal } from '@/components/Seal';
import {
  threatToTone,
  wrappedSummaryLine,
  type WrappedIssue,
} from '@/lib/fart-wrapped';
import { createSeedPayload, serializeSeedPayload } from '@/lib/seed';

interface WrappedSharePosterProps {
  issue: WrappedIssue;
  onShareOpened: (variantId: string) => void;
  onPosterCopied: (kind: 'summary' | 'closing') => void;
}

const EASE = [0.22, 0.61, 0.36, 1] as const;

/**
 * §IV — Share-ready ceremonial poster.
 *
 * Two-column composition:
 *
 *   - Left: a tall 9:16-aspect poster that reads as a screenshotable
 *     artifact in its own right — wordmark, subject, classification at
 *     poster scale, score readout, badge column, and a Bureau seal.
 *   - Right: an action rail with the share headline, three CopyButtons
 *     (summary line, full headline, closing statement), and a "Save
 *     share card" deep link into `/share` that carries the wrapped
 *     overrides through our seed plumbing so the exported PNG matches
 *     the personal cycle.
 *
 * No client-side rasterisation is performed here — the poster is a real
 * DOM block, screenshottable as-is, and the share-card export already
 * handles the PNG side.
 */
export const WrappedSharePoster: FC<WrappedSharePosterProps> = ({
  issue,
  onShareOpened,
  onPosterCopied,
}) => {
  const summary = wrappedSummaryLine(issue);
  const headline = `${issue.shareHeadline} ${summary}`;

  // Deep link into /share with wrapped overrides applied via the seed
  // plumbing. The custom subject ("An anonymous citizen") and the cycle
  // score travel into the share-card export verbatim.
  const shareHref = useMemo(() => {
    const payload = createSeedPayload({
      targetLabel: issue.subjectLabel,
      targetType: 'custom',
      powerScore: issue.averagePowerScore,
      threatLevel: issue.dominantThreatLevel,
    });
    const params = new URLSearchParams({
      variant: issue.primaryVariantId,
      from: 'fart-wrapped',
    });
    serializeSeedPayload(payload).forEach((v, k) => params.set(k, v));
    return `/share?${params.toString()}`;
  }, [issue]);

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
          §IV
        </span>
        <span>ANNUAL SHARE POSTER · SCREENSHOT-READY</span>
        <span aria-hidden="true" className="brand-rule h-px flex-1 opacity-40" />
      </header>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_1fr] lg:gap-12">
        {/* — Poster — */}
        <figure
          className={[
            'relative isolate mx-auto w-full max-w-[460px] overflow-hidden rounded-md border border-[var(--border-stark)]',
            'aspect-[9/14]',
            'bg-[var(--bg-panel)] shadow-[0_50px_90px_-40px_color-mix(in_oklab,black_80%,transparent)]',
          ].join(' ')}
          aria-label="Annual share poster"
        >
          {/* Top band */}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between border-b border-[var(--accent-brass)] bg-[color-mix(in_oklab,var(--accent-brass)_8%,transparent)] px-5 py-2.5">
            <div className="flex items-center gap-2 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
              <span aria-hidden="true" className="brand-rule h-px w-5 opacity-90" />
              BUREAU OF ACOUSTIC GASOLOGY
            </div>
            <div className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
              {issue.cycleLabel}
            </div>
          </div>

          {/* Body */}
          <div className="absolute inset-x-0 bottom-0 top-12 flex flex-col gap-4 p-6">
            <div>
              <div className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
                ISSUED FOR
              </div>
              <div className="mt-1 truncate font-display text-[1.05rem] leading-tight text-[var(--text-strong)]">
                {issue.subjectLabel}
              </div>
            </div>

            <div
              className={[
                'font-display font-medium leading-[0.92] tracking-tight text-[var(--text-strong)]',
                'text-[clamp(2.4rem,8vw,3.4rem)]',
              ].join(' ')}
            >
              Fart{' '}
              <span className="italic text-[var(--accent-brass)]">Wrapped</span>
            </div>

            <div className="rounded-sm border border-dashed border-[var(--border-brass)] bg-[color-mix(in_oklab,var(--accent-brass)_5%,transparent)] p-4">
              <div className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
                PRIMARY CLASSIFICATION
              </div>
              <div className="mt-1 font-display text-[1.4rem] leading-tight tracking-tight text-[var(--text-strong)]">
                {issue.primaryClassification}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <div className="font-mono text-[0.5rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
                    AVG SCORE
                  </div>
                  <div className="mt-0.5 flex items-baseline gap-1">
                    <span
                      className="font-display text-[var(--text-strong)]"
                      style={{
                        fontSize: '1.6rem',
                        lineHeight: 1,
                        fontWeight: 500,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {issue.averagePowerScore}
                    </span>
                    <span className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
                      / 100
                    </span>
                  </div>
                </div>
                <div>
                  <div className="font-mono text-[0.5rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
                    DOMINANT THREAT
                  </div>
                  <div className="mt-1">
                    <Chip tone={threatToTone(issue.dominantThreatLevel)} withDot>
                      {issue.dominantThreatLevel.toUpperCase()}
                    </Chip>
                  </div>
                </div>
              </div>
            </div>

            <ul className="grid grid-cols-1 gap-2">
              {issue.badges.slice(0, 3).map((b) => (
                <li
                  key={b.id}
                  className="flex items-center gap-2 rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-panel-strong)] px-3 py-1.5"
                >
                  <span className="font-mono text-[0.5rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
                    {b.code}
                  </span>
                  <span className="truncate text-[0.78rem] text-[var(--text-strong)]">{b.title}</span>
                </li>
              ))}
            </ul>

            <div className="mt-auto flex items-end justify-between border-t border-dashed border-[var(--border-subtle)] pt-3">
              <div className="text-[var(--accent-brass)]">
                <Seal size={44} className="opacity-95" />
              </div>
              <div className="text-right">
                <div className="font-mono text-[0.5rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
                  ISSUED · §0.1
                </div>
                <div className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-default)]">
                  {issue.wrappedCycleId}
                </div>
              </div>
            </div>
          </div>
        </figure>

        {/* — Action rail — */}
        <aside className="flex flex-col gap-5">
          <div>
            <div className="flex items-center gap-2 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
              <span aria-hidden="true" className="brand-rule h-px w-5 opacity-90" />
              CEREMONIAL SHARE PACKET
            </div>
            <h3 className="mt-3 font-display text-[1.55rem] leading-tight tracking-tight text-[var(--text-strong)] sm:text-[1.75rem]">
              Issue your annual artifact to the public record.
            </h3>
            <p className="mt-3 max-w-[44ch] text-[0.92rem] leading-snug text-[var(--text-default)]">
              The poster is rendered to brand specification and ready for hand-held viewing
              surfaces. Save a share card for circulation; copy the citation lines for caption use.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={shareHref}
              onClick={() => onShareOpened(issue.primaryVariantId)}
              className={[
                'inline-flex items-center gap-2 rounded-sm bg-[var(--accent-brass)] px-5 py-3',
                'font-mono text-[0.65rem] uppercase tracking-wide-2 text-[var(--bg-base)]',
                'shadow-[0_1px_0_0_color-mix(in_oklab,white_18%,transparent)_inset,0_-1px_0_0_color-mix(in_oklab,black_22%,transparent)_inset]',
                'transition-colors hover:bg-[var(--color-brass-400)]',
              ].join(' ')}
            >
              Save annual share card
              <Arrow />
            </Link>
          </div>

          <div className="rounded-md border border-[var(--border-stark)] bg-[var(--bg-panel)] p-5">
            <ul className="flex flex-col gap-3">
              <CopyLine
                label="SUMMARY LINE"
                text={summary}
                onCopy={() => onPosterCopied('summary')}
              />
              <CopyLine
                label="SHARE HEADLINE"
                text={headline}
                onCopy={() => onPosterCopied('summary')}
              />
              <CopyLine
                label="CLOSING STATEMENT"
                text={issue.closingStatement}
                onCopy={() => onPosterCopied('closing')}
              />
            </ul>
            <p className="mt-4 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
              SCREENSHOT THE POSTER OR EXPORT A SHARE CARD FOR PNG DELIVERY.
            </p>
          </div>
        </aside>
      </div>
    </motion.section>
  );
};

const CopyLine: FC<{ label: string; text: string; onCopy: () => void }> = ({
  label,
  text,
  onCopy,
}) => (
  <li className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
    <div className="min-w-0 flex-1">
      <div className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
        {label}
      </div>
      <div className="mt-1 truncate font-display text-[0.95rem] leading-snug text-[var(--text-strong)]">
        {text}
      </div>
    </div>
    <CopyButton text={text} onCopy={onCopy}>
      COPY
    </CopyButton>
  </li>
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
