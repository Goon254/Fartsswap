/**
 * Community / reporter reason codes (public flag flow).
 * Typed scaffolding — expand with copy + routing rules as the gallery ships.
 */
export const GALLERY_USER_REPORT_REASONS = [
  'explicit_content',
  'harassment',
  'slur_or_hate',
  'minor_safety',
  'copyrighted_audio_or_music',
  'spam',
  'impersonation',
  'policy_other',
] as const;

export type GalleryUserReportReason = (typeof GALLERY_USER_REPORT_REASONS)[number];

export function isGalleryUserReportReason(value: string): value is GalleryUserReportReason {
  return (GALLERY_USER_REPORT_REASONS as readonly string[]).includes(value);
}

/** Operator moderation / enforcement (subset overlaps user reasons). */
export const GALLERY_OPERATOR_REASON_CODES = [
  ...GALLERY_USER_REPORT_REASONS,
  'quality_gate',
  'duplicate_submission',
  'automation_flag',
  'legal_takedown',
  'operator_other',
] as const;

export type GalleryOperatorReasonCode = (typeof GALLERY_OPERATOR_REASON_CODES)[number];

export function isGalleryOperatorReasonCode(value: string): value is GalleryOperatorReasonCode {
  return (GALLERY_OPERATOR_REASON_CODES as readonly string[]).includes(value);
}

export interface AutomatedScreeningResultV1 {
  readonly pipelineVersion: 1;
  readonly passed: boolean;
  readonly signals: readonly string[];
  readonly reviewedAt: string;
}

export function runGalleryAutomatedScreeningStub(): AutomatedScreeningResultV1 {
  return {
    pipelineVersion: 1,
    passed: true,
    signals: [],
    reviewedAt: new Date().toISOString(),
  };
}
