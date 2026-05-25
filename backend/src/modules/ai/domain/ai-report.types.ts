/**
 * Public types for the AI report orchestration layer.
 *
 * These are kept separate from `shared/domain/models.ts` so the AI layer can
 * evolve its own field set (e.g. add `genre`, `confidenceLabel`, `warningBadge`)
 * without forcing every consumer of `Report` to widen their projection.
 *
 * The orchestrator returns an `AiReportFields` envelope. Persistence layers
 * map the subset they care about onto the existing `Report` row; the extras
 * are stored on `report_inputs.metadata` (transparently, server-controlled).
 */

import type { ReportSource } from '../../../shared/domain/types';

/**
 * Normalised input passed into the orchestrator. Whoever builds this has
 * already stripped session/cookie data and any PII; the orchestrator must
 * never see raw user-agent strings, IP addresses, or storage keys.
 */
export interface AiReportRequest {
  source: ReportSource;
  /** User-supplied custom name (already trimmed; may still be empty). */
  customFartName?: string;
  /** One of: 'clinical' | 'dramatic' | 'wholesome' (free-form, validated by domain elsewhere). */
  tonePreset?: string;
  /** Duration in seconds, for audio-based reports only. */
  durationSeconds?: number;
  /** Safe metadata about the captured audio, used to shape user prompt only. */
  audioMetadata?: {
    mimeType?: string;
    sizeBytes?: number;
  };
  /**
   * Deterministic seed used by the fallback generator + for the
   * server-controlled report hash. Only an opaque `VARIATION_NONCE`
   * derived from this value is included in prompts (not the raw seed).
   */
  seed: string;
  /**
   * Anonymous session id. Used ONLY for quota accounting and outbox analytics
   * attribution. Never included in prompts.
   */
  sessionId?: string;
  /**
   * Best-effort client IP for quota accounting (X-Forwarded-For first hop,
   * falling back to request.ip). Never logged in cleartext via metrics labels.
   */
  ipAddress?: string;
}

export type ThreatLevel = 'Green' | 'Amber' | 'Red' | 'Cerulean';

export type ConfidenceLabel = 'Low' | 'Moderate' | 'High' | 'Speculative';

/**
 * Fully-validated AI report payload, ready to persist.
 *
 * - All string fields are length-capped + whitespace-normalised.
 * - `threatLevel` is normalised to the closed set.
 * - `reportHash` is generated server-side from the seed; the model's
 *   suggestion (if any) is discarded.
 */
export interface AiReportFields {
  fartName: string;
  classification: string;
  powerScore: number;
  /** Duration in milliseconds. Server-clamped, comes from input for audio flows. */
  durationMs: number;
  emotionalTone: string;
  probableCause: string;
  cinematicParallel: string;
  threatLevel: ThreatLevel;
  shortSummary: string;
  reportHash: string;
  genre?: string;
  confidenceLabel?: ConfidenceLabel;
  warningBadge?: string;
}

/**
 * Orchestrator result envelope. Carries provenance so analytics + logging can
 * record fallback usage without polluting `AiReportFields`.
 */
export interface AiReportResult {
  fields: AiReportFields;
  meta: {
    /** Where the semantic content came from. */
    source: 'model' | 'fallback';
    /** Logical AI provider id; 'deterministic' when fallback was used. */
    provider: string;
    /** Model id; 'fallback' when fallback was used. */
    model: string;
    /** End-to-end orchestration latency (model call + validation + sanitization). */
    latencyMs: number;
    /** True when the fallback path produced the fields. */
    fallbackUsed: boolean;
    /** Free-form reason for fallback. Empty when source='model'. */
    fallbackReason?: string;
  };
}
