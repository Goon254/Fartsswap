'use client';

import { motion } from 'framer-motion';
import { useCallback, useEffect, useState, type FC } from 'react';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { ReportPreviewCard } from '@/components/ReportPreviewCard';
import { SAMPLE_REPORT } from '@/lib/data';
import { RESULT_VARIANTS } from '@/lib/result-variants';

interface SampleArtifactPreviewProps {
  /** Fires before navigation when the user opens the released specimen. */
  onOpenSample: (variantId: string) => void;
}

const EASE = [0.22, 0.61, 0.36, 1] as const;

/**
 * One blurred / partially-redacted sample dossier on the launch shell.
 *
 * The Bureau is happy to show *that* a dossier exists, but unwilling to
 * release the full file until the public filing line opens. The user can
 * "release one specimen" by clicking through to /report, which lifts the
 * redaction in the canonical product flow.
 *
 * UX details:
 *   - The dossier is rendered behind a frosted veil with a "PENDING
 *     DECLASSIFICATION" stamp.
 *   - Hovering the panel lifts the veil ~30% so the artifact can be
 *     half-read at-a-glance.
 *   - A pair of variant pills under the panel let the user browse 3
 *     pre-selected specimens before requesting release.
 */
export const SampleArtifactPreview: FC<SampleArtifactPreviewProps> = ({ onOpenSample }) => {
  const candidates = SAMPLE_VARIANT_IDS.map((id) => RESULT_VARIANTS.find((v) => v.id === id)).filter(
    (v): v is (typeof RESULT_VARIANTS)[number] => Boolean(v),
  );
  const [activeId, setActiveId] = useState<string>(candidates[0]?.id ?? SAMPLE_REPORT.fartName);

  const sampleHref = `/report?variant=${encodeURIComponent(activeId)}&from=launch`;
  const onClick = useCallback(() => {
    onOpenSample(activeId);
  }, [activeId, onOpenSample]);

  // The visible preview always shows the canonical SAMPLE_REPORT data
  // because that's what ReportPreviewCard renders. The variant pills
  // act as "which specimen will you release if you click through" — so
  // changing the active id changes the deep link target, not the
  // visible content. This keeps the preview surface visually stable
  // while still implying a catalog behind the veil.
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
        <span>SPECIMEN PENDING DECLASSIFICATION</span>
        <span aria-hidden="true" className="brand-rule h-px flex-1 opacity-40" />
        <span className="hidden font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)] md:inline">
          PRE-RELEASE PREVIEW · NOT YET FILED PUBLICLY
        </span>
      </header>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1.05fr_1fr] lg:gap-12">
        <RedactedDossier />

        <aside className="flex flex-col gap-6">
          <div>
            <div className="flex items-center gap-2 font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
              <span aria-hidden="true" className="brand-rule h-px w-6 opacity-90" />
              SELECT SPECIMEN
            </div>
            <ul className="mt-3 flex flex-col gap-2">
              {candidates.map((v) => {
                const selected = v.id === activeId;
                return (
                  <li key={v.id}>
                    <button
                      type="button"
                      onClick={() => setActiveId(v.id)}
                      aria-pressed={selected}
                      className={[
                        'group/spec w-full rounded-md border px-4 py-3 text-left transition-colors',
                        selected
                          ? 'border-[var(--accent-brass)] bg-[color-mix(in_oklab,var(--accent-brass)_8%,transparent)]'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-panel)] hover:border-[var(--border-stark)]',
                      ].join(' ')}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
                          {v.switcherCode}
                        </span>
                        <span className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
                          {v.caseFile}
                        </span>
                      </div>
                      <div className="mt-1 font-display text-[1.1rem] leading-tight tracking-tight text-[var(--text-strong)]">
                        {v.classification}
                      </div>
                      <div className="mt-0.5 truncate text-[0.85rem] text-[var(--text-default)]">
                        {v.subjectTitle}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="rounded-md border border-dashed border-[var(--border-brass)] bg-[color-mix(in_oklab,var(--accent-brass)_6%,transparent)] p-5">
            <div className="flex items-center gap-2 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
              <span aria-hidden="true" className="brand-rule h-px w-6 opacity-90" />
              CLEARED FOR RELEASE
            </div>
            <p className="mt-2 max-w-[40ch] text-[0.9rem] leading-snug text-[var(--text-default)]">
              The Bureau is releasing exactly one full specimen ahead of the public filing line.
              Open the dossier to inspect the artifact in full.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button variant="primary" href={sampleHref} onClick={onClick} trailing={<Arrow />}>
                Release specimen
              </Button>
              <Chip tone="neutral">NO PAYMENT REQUIRED</Chip>
            </div>
          </div>
        </aside>
      </div>
    </motion.section>
  );
};

const SAMPLE_VARIANT_IDS = [
  'velvet_foghorn',
  'conference_room_incident',
  'melancholy_jazz_fusion',
] as const;

/**
 * Frosted/redacted version of the existing ReportPreviewCard. Re-uses the
 * exact same composition (so the layout never drifts from /report) but
 * overlays a veil, redaction bars on the title rows, and a diagonal stamp.
 */
const RedactedDossier: FC = () => {
  const [hovered, setHovered] = useState(false);
  // Reduced-motion respect: we keep the hover *visible state* but no
  // transitions inside this branch. Framer Motion handles that globally
  // via `prefers-reduced-motion` in our `transitionBrand` config.
  useEffect(() => {
    // no-op, keeps `hovered` reactive for the className memoisation
  }, [hovered]);

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
    >
      {/* The actual dossier card */}
      <div aria-hidden="true">
        <ReportPreviewCard report={SAMPLE_REPORT} />
      </div>

      {/* Frosted veil + redactions */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg">
        {/* Frosted overlay */}
        <span
          aria-hidden="true"
          className={[
            'absolute inset-0 backdrop-blur-[6px] transition-opacity duration-500',
            hovered ? 'opacity-60' : 'opacity-95',
          ].join(' ')}
          style={{
            background:
              'color-mix(in oklab, var(--bg-base) 70%, transparent)',
          }}
        />
        {/* Diagonal "PENDING DECLASSIFICATION" stamp */}
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center"
          style={{ transform: 'rotate(-8deg)' }}
        >
          <span
            className="rounded-sm border-2 px-6 py-3 font-display italic"
            style={{
              borderColor: 'color-mix(in oklab, var(--accent-brass) 80%, transparent)',
              color: 'color-mix(in oklab, var(--accent-brass) 90%, transparent)',
              backgroundColor: 'color-mix(in oklab, var(--bg-panel-strong) 80%, transparent)',
              fontSize: 'clamp(0.95rem, 2.2vw, 1.4rem)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Pending declassification
          </span>
        </span>
        {/* Redaction bars on the header rows */}
        <span
          aria-hidden="true"
          className="absolute left-6 top-[110px] h-4 w-[60%] rounded-sm bg-[var(--text-strong)] opacity-90"
        />
        <span
          aria-hidden="true"
          className="absolute left-6 top-[170px] h-3 w-[40%] rounded-sm bg-[var(--text-strong)] opacity-90"
        />
      </div>

      {/* Footer caption — sits outside the veil */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
        <span>HOVER TO LIFT VEIL · CLICK TO RELEASE FULL ARTIFACT</span>
        <span>SPECIMEN CATALOG · 3 OF 6 VIEWABLE</span>
      </div>
    </div>
  );
};

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
