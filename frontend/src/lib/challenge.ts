/**
 * Frontend-only challenge model + URL serialization.
 *
 * A "challenge" is a small, signed-by-vibes packet that turns one user's
 * dossier into a competitive invitation. The packet is the only thing the
 * frontend needs in this milestone — no backend persistence, no shared
 * state, just URL params that round-trip cleanly.
 *
 * Schema is kept human-readable so URLs are debuggable in the wild:
 *   /challenge?variant=gaslight_sonata
 *             &score=71
 *             &type=beat_score
 *             &source=report
 *             &id=ch_3f9a2b1c
 *             &issuedAt=2026-05-17T21:00:00Z
 *             &from=mine            ← optional sender-preview flag
 *
 * When a backend lands later, it should accept the same shape verbatim and
 * upgrade `id` to a real, signed challenge token.
 */

import { getVariantById, RESULT_VARIANTS, type ResultVariant } from './result-variants';

export type ChallengeType = 'beat_score' | 'rarer_classification' | 'open';
export type ChallengeSourceSurface = 'report' | 'share';
export type ChallengePerspective = 'recipient' | 'sender';

export interface Challenge {
  challengeId: string;
  sourceVariantId: string;
  sourceScore: number;
  /** Optional mock "from" label. Reserved for a future identity layer. */
  challengerLabel?: string;
  /** ISO timestamp. */
  issuedAt: string;
  challengeType: ChallengeType;
  sourceSurface: ChallengeSourceSurface;
}

const VALID_TYPES: readonly ChallengeType[] = ['beat_score', 'rarer_classification', 'open'];
const VALID_SURFACES: readonly ChallengeSourceSurface[] = ['report', 'share'];

/**
 * Construct a Challenge from a result variant + the surface the user clicked
 * the challenge entry-point on.
 *
 * Note: `Date.now()` is the only source of nondeterminism — every other
 * field is derived from the variant — so the same variant on the same
 * machine produces a stable issuedAt within one render cycle.
 */
export function createChallenge(input: {
  variant: ResultVariant;
  sourceSurface: ChallengeSourceSurface;
  challengeType?: ChallengeType;
  challengerLabel?: string;
}): Challenge {
  return {
    challengeId: generateChallengeId(),
    sourceVariantId: input.variant.id,
    sourceScore: clampInt(input.variant.powerScore, 0, 100),
    issuedAt: new Date().toISOString(),
    challengeType: input.challengeType ?? 'beat_score',
    sourceSurface: input.sourceSurface,
    ...(input.challengerLabel ? { challengerLabel: input.challengerLabel } : {}),
  };
}

/**
 * Serialize a Challenge into a `URLSearchParams` ready to attach to any
 * route (challenge, report, analyze). Sender-preview links pass
 * `{ preview: true }` to mark themselves with `from=mine`; the public
 * recipient URL omits the flag.
 */
export function serializeChallenge(
  challenge: Challenge,
  options: { preview?: boolean } = {},
): URLSearchParams {
  const params = new URLSearchParams();
  params.set('variant', challenge.sourceVariantId);
  params.set('score', String(challenge.sourceScore));
  params.set('type', challenge.challengeType);
  params.set('source', challenge.sourceSurface);
  params.set('id', challenge.challengeId);
  params.set('issuedAt', challenge.issuedAt);
  if (challenge.challengerLabel) params.set('label', challenge.challengerLabel);
  if (options.preview) params.set('from', 'mine');
  return params;
}

/**
 * Build the full sharable link for a challenge. Defaults to the recipient
 * view (omits `from=mine`).
 */
export function createChallengeLink(
  challenge: Challenge,
  options: { preview?: boolean; origin?: string; pathname?: string } = {},
): string {
  const params = serializeChallenge(challenge, { preview: options.preview });
  const path = options.pathname ?? '/challenge';
  if (options.origin) return `${options.origin.replace(/\/+$/, '')}${path}?${params.toString()}`;
  return `${path}?${params.toString()}`;
}

/**
 * Parse a Challenge out of an arbitrary `URLSearchParams` (Next 15 server
 * components hand us a `Record<string,string|string[]>`; for convenience we
 * accept either shape).
 *
 * Returns `null` when the params don't carry enough valid information to
 * form a challenge — the page should fall back to a default mock so deep
 * links never produce a broken UX.
 */
export function parseChallengeFromSearchParams(
  input: URLSearchParams | Record<string, string | string[] | undefined> | null | undefined,
): Challenge | null {
  if (!input) return null;
  const get = (key: string): string | null => {
    if (input instanceof URLSearchParams) {
      return input.get(key);
    }
    const v = input[key];
    if (Array.isArray(v)) return v[0] ?? null;
    return typeof v === 'string' ? v : null;
  };

  const variant = (get('variant') ?? '').trim();
  if (!variant) return null;
  // We tolerate unknown variant ids by falling back to the first registered
  // variant — keeps the link working even if a future variant is renamed.
  const resolved = getVariantById(variant);
  if (!resolved) return null;

  const scoreRaw = get('score');
  const score = scoreRaw === null ? resolved.powerScore : Number(scoreRaw);
  if (!Number.isFinite(score)) return null;

  const typeRaw = (get('type') ?? 'beat_score') as ChallengeType;
  const sourceRaw = (get('source') ?? 'report') as ChallengeSourceSurface;
  const issuedAt = get('issuedAt') ?? new Date().toISOString();
  const id = get('id') ?? generateChallengeId();
  const label = get('label') ?? undefined;

  return {
    challengeId: id,
    sourceVariantId: resolved.id,
    sourceScore: clampInt(score, 0, 100),
    challengeType: VALID_TYPES.includes(typeRaw) ? typeRaw : 'beat_score',
    sourceSurface: VALID_SURFACES.includes(sourceRaw) ? sourceRaw : 'report',
    issuedAt,
    ...(label ? { challengerLabel: label } : {}),
  };
}

/**
 * Read the optional `from=mine` flag separately so the same parser can be
 * used by both the recipient view (default) and the sender-preview view.
 */
export function parseChallengePerspective(
  input: URLSearchParams | Record<string, string | string[] | undefined> | null | undefined,
): ChallengePerspective {
  if (!input) return 'recipient';
  const from =
    input instanceof URLSearchParams
      ? input.get('from')
      : Array.isArray(input.from)
        ? input.from[0]
        : input.from;
  return from === 'mine' ? 'sender' : 'recipient';
}

/**
 * Fallback challenge for empty/invalid deep links so the page never blanks.
 * Picks a recognisable, middle-tier variant.
 */
export function defaultMockChallenge(): Challenge {
  const fallbackVariant =
    RESULT_VARIANTS.find((v) => v.id === 'gaslight_sonata') ?? RESULT_VARIANTS[0]!;
  return {
    challengeId: 'ch_demo000000000',
    sourceVariantId: fallbackVariant.id,
    sourceScore: fallbackVariant.powerScore,
    challengeType: 'beat_score',
    sourceSurface: 'report',
    issuedAt: '2026-05-17T21:00:00.000Z',
  };
}

/**
 * The score the challenger needs to exceed to win. We keep the formula in
 * one place so the rival card, the "Beat this" panel, and the analytics
 * agree on what "beat" means.
 */
export function thresholdToBeat(challenge: Challenge): number {
  return Math.min(100, challenge.sourceScore + 1);
}

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function generateChallengeId(): string {
  if (typeof window !== 'undefined' && typeof window.crypto?.randomUUID === 'function') {
    // Compact form: `ch_` + first 12 hex chars of the UUID. Plenty of
    // namespace for an MVP and short enough to keep URLs readable.
    return `ch_${window.crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
  }
  return `ch_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
