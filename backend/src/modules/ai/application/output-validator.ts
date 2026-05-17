import { createHash } from 'crypto';
import { aiReportModelSchema, FIELD_CAPS, type AiReportModelOutput } from '../domain/ai-report.schema';
import {
  sanitizeIntegerInRange,
  sanitizeString,
} from '../domain/safety-filter';
import type {
  AiReportFields,
  AiReportRequest,
  ConfidenceLabel,
  ThreatLevel,
} from '../domain/ai-report.types';
import type { FakeReportFields } from '../../reports/domain/fake-report-generator';

const THREAT_LEVELS: readonly ThreatLevel[] = ['Green', 'Amber', 'Red', 'Cerulean'];
const CONFIDENCE_LABELS: readonly ConfidenceLabel[] = [
  'Low',
  'Moderate',
  'High',
  'Speculative',
];

export class AiOutputParseError extends Error {
  constructor(
    public readonly reason: 'not_json' | 'not_object' | 'schema_invalid',
    public override readonly cause?: unknown,
  ) {
    super(`AI output parse failed: ${reason}`);
    this.name = 'AiOutputParseError';
  }
}

/**
 * Parse raw model text into a `AiReportModelOutput`. Throws `AiOutputParseError`
 * on any failure so the orchestrator can route to fallback uniformly.
 *
 * Accepts:
 *  - bare JSON object (`{ ... }`)
 *  - JSON wrapped in ```json fenced blocks
 *  - JSON with leading/trailing prose (extracts the first `{...}` balanced)
 */
export function parseModelOutput(raw: string): AiReportModelOutput {
  const candidate = extractJsonObject(raw);
  if (!candidate) {
    throw new AiOutputParseError('not_json');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch (error) {
    throw new AiOutputParseError('not_json', error);
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new AiOutputParseError('not_object');
  }
  const result = aiReportModelSchema.safeParse(parsed);
  if (!result.success) {
    throw new AiOutputParseError('schema_invalid', result.error);
  }
  return result.data;
}

/**
 * Map a validated model output onto the canonical `AiReportFields`, applying:
 *  - the safety filter (disallowed-content scrub + truncation)
 *  - allowed-value normalisation for enums (threatLevel, confidenceLabel)
 *  - server-generated `reportHash` (never trusts the model)
 *  - field-level fallbacks from the deterministic generator
 */
export function normaliseModelOutput(
  output: AiReportModelOutput,
  request: AiReportRequest,
  fallback: FakeReportFields,
): AiReportFields {
  const fields: AiReportFields = {
    fartName: sanitizeString(output.fartName, {
      maxLength: FIELD_CAPS.fartName,
      fallback: fallback.fartName,
    }),
    classification: sanitizeString(output.classification, {
      maxLength: FIELD_CAPS.classification,
      fallback: fallback.classification,
    }),
    powerScore: sanitizeIntegerInRange(output.powerScore, {
      min: 0,
      max: 100,
      fallback: fallback.powerScore,
    }),
    durationMs: deriveDurationMs(request, fallback),
    emotionalTone: sanitizeString(output.emotionalTone, {
      maxLength: FIELD_CAPS.emotionalTone,
      fallback: fallback.emotionalTone,
    }),
    probableCause: sanitizeString(output.probableCause, {
      maxLength: FIELD_CAPS.probableCause,
      fallback: fallback.probableCause,
    }),
    cinematicParallel: sanitizeString(output.cinematicParallel, {
      maxLength: FIELD_CAPS.cinematicParallel,
      fallback: fallback.cinematicParallel,
    }),
    threatLevel: normaliseEnum(output.threatLevel, THREAT_LEVELS, fallbackThreat(fallback)),
    shortSummary: sanitizeString(output.shortSummary, {
      maxLength: FIELD_CAPS.shortSummary,
      fallback: deriveDefaultSummary(fallback),
    }),
    reportHash: generateReportHash(request.seed),
  };

  // Optional fields — only include when sanitisation produced a non-fallback value.
  const genre = sanitizeOptionalString(output.genre, FIELD_CAPS.genre);
  if (genre) fields.genre = genre;

  const confidence = normaliseOptionalEnum(output.confidenceLabel, CONFIDENCE_LABELS);
  if (confidence) fields.confidenceLabel = confidence;

  const warning = sanitizeOptionalString(output.warningBadge, FIELD_CAPS.warningBadge);
  if (warning) fields.warningBadge = warning;

  return fields;
}

/**
 * Produce a fully-fallback `AiReportFields` from the deterministic generator.
 * Used whenever the model path is unavailable or fails validation.
 */
export function buildFallbackFields(
  request: AiReportRequest,
  fallback: FakeReportFields,
): AiReportFields {
  return {
    fartName: fallback.fartName,
    classification: fallback.classification,
    powerScore: fallback.powerScore,
    durationMs: deriveDurationMs(request, fallback),
    emotionalTone: fallback.emotionalTone,
    probableCause: fallback.probableCause,
    cinematicParallel: fallback.cinematicParallel,
    threatLevel: fallbackThreat(fallback),
    shortSummary: deriveDefaultSummary(fallback),
    reportHash: generateReportHash(request.seed),
  };
}

function deriveDurationMs(request: AiReportRequest, fallback: FakeReportFields): number {
  if (typeof request.durationSeconds === 'number' && Number.isFinite(request.durationSeconds)) {
    const clamped = Math.max(0.1, Math.min(10, request.durationSeconds));
    return Math.round(clamped * 1000);
  }
  return fallback.durationMs;
}

function deriveDefaultSummary(fallback: FakeReportFields): string {
  return [
    `${fallback.classification}.`,
    `${fallback.emotionalTone}.`,
    `Threat level ${fallback.threatLevel}.`,
  ].join(' ');
}

function fallbackThreat(fallback: FakeReportFields): ThreatLevel {
  return normaliseEnum(fallback.threatLevel, THREAT_LEVELS, 'Amber');
}

function normaliseEnum<T extends string>(
  raw: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  if (typeof raw !== 'string') return fallback;
  const lower = raw.trim().toLowerCase();
  const found = allowed.find((a) => a.toLowerCase() === lower);
  return found ?? fallback;
}

function normaliseOptionalEnum<T extends string>(
  raw: unknown,
  allowed: readonly T[],
): T | undefined {
  if (typeof raw !== 'string') return undefined;
  const lower = raw.trim().toLowerCase();
  return allowed.find((a) => a.toLowerCase() === lower);
}

function sanitizeOptionalString(raw: unknown, max: number): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const value = sanitizeString(raw, { maxLength: max, fallback: '' });
  return value.length > 0 ? value : undefined;
}

/**
 * Server-generated report hash. The model's suggestion is intentionally
 * discarded. This is deterministic over the seed so retrying the same logical
 * request produces the same hash — useful for tests + future dedupe.
 */
function generateReportHash(seed: string): string {
  return `fart_${createHash('sha256').update(seed).digest('hex').slice(0, 16)}`;
}

/**
 * Pull the first balanced `{...}` block out of arbitrary model text.
 * Tolerates code fences and leading/trailing prose without using a
 * fragile regex. Returns `null` when no balanced object is found.
 */
function extractJsonObject(raw: string): string | null {
  if (typeof raw !== 'string') return null;
  const text = raw.replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, '').trim();
  const start = text.indexOf('{');
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === '\\') {
        escape = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }
  return null;
}
