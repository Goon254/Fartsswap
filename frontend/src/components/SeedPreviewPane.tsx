'use client';

import type { FC } from 'react';
import { Chip } from '@/components/Chip';
import { ReportPreviewCard } from '@/components/ReportPreviewCard';
import type { PreviewReport } from '@/lib/data';
import type { ResultVariant } from '@/lib/result-variants';
import { TARGET_TYPES, type TargetType } from '@/lib/seed';

interface SeedPreviewPaneProps {
  variant: ResultVariant;
  targetType: TargetType;
}

/**
 * Live preview of the dossier with overrides applied.
 *
 * The orchestrator passes a *variant with overrides already applied* so
 * this component stays a pure renderer. It maps `ResultVariant` →
 * `PreviewReport` and hands it off to the same `<ReportPreviewCard>` the
 * homepage uses, so what the operator sees here is what a journalist or
 * creator will see when they open the seeded /report URL.
 *
 * Two small chips above the card communicate the seeded state: a brass
 * "SEEDED" chip and the target-type label. No interaction, no copy
 * affordances; that all lives in `SeedLinkPanel`.
 */
export const SeedPreviewPane: FC<SeedPreviewPaneProps> = ({ variant, targetType }) => {
  const preview = variantToPreview(variant);
  const typeLabel = TARGET_TYPES.find((t) => t.id === targetType)?.label ?? 'Custom subject';

  return (
    <section
      className={[
        'relative overflow-hidden rounded-md border border-[var(--border-stark)]',
        'bg-[color-mix(in_oklab,var(--bg-panel)_88%,transparent)] p-6',
        'shadow-[0_30px_60px_-30px_color-mix(in_oklab,black_70%,transparent)]',
      ].join(' ')}
    >
      <header className="mb-5 flex items-center justify-between gap-3 border-b border-dashed border-[var(--border-subtle)] pb-3">
        <div className="flex items-center gap-3 font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
          <span aria-hidden="true" className="brand-rule h-px w-6 opacity-90" />
          <span className="rounded-sm border border-[var(--border-brass)] px-1.5 py-px text-[0.6rem]">
            §IV
          </span>
          <span>LIVE SPECIMEN · PREVIEW</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone="brass">SEEDED</Chip>
          <Chip tone="neutral">{typeLabel.toUpperCase()}</Chip>
        </div>
      </header>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-[0.85rem]">
        <div className="min-w-0">
          <div className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
            SUBJECT
          </div>
          <div className="truncate font-display text-[1.05rem] leading-tight text-[var(--text-strong)]">
            {variant.subjectTitle}
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
            CLASSIFICATION
          </div>
          <div className="font-display text-[1.05rem] leading-tight text-[var(--accent-brass)]">
            {variant.classification}
          </div>
        </div>
      </div>

      <ReportPreviewCard report={preview} />

      <footer className="mt-4 flex flex-wrap items-center gap-2 border-t border-dashed border-[var(--border-subtle)] pt-3 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
        <span>PREVIEW REFLECTS LIVE OVERRIDES</span>
        <span aria-hidden="true">·</span>
        <span>VARIANT {variant.id.toUpperCase()}</span>
        <span aria-hidden="true">·</span>
        <span>SCORE {variant.powerScore} / 100</span>
        <span aria-hidden="true">·</span>
        <span>THREAT {variant.threatLevel.toUpperCase()}</span>
      </footer>
    </section>
  );
};

function variantToPreview(v: ResultVariant): PreviewReport {
  // PreviewReport's confidence enum doesn't include 'Low' — collapse it
  // into 'Speculative' so the preview card never receives an unknown
  // confidence label.
  const confidence: PreviewReport['confidenceLabel'] =
    v.confidenceLabel === 'Low' ? 'Speculative' : v.confidenceLabel;

  return {
    classification: v.classification,
    fartName: v.subjectTitle,
    powerScore: v.powerScore,
    durationMs: v.durationMs,
    emotionalTone: v.emotionalTone,
    probableCause: v.probableCause,
    cinematicParallel: v.cinematicParallel,
    threatLevel: v.threatLevel,
    confidenceLabel: confidence,
    reportHash: v.reportHash,
    caseFile: v.caseFile,
    issuedAtIso: v.issuedAtIso,
  };
}
