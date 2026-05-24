/**
 * Creator seeding payload + helpers.
 *
 * The seed tool needs to ship a lightweight set of "overrides" through
 * URLs into the existing product surfaces (/report, /share, /challenge)
 * without breaking the default flow. This module defines:
 *
 *   - the typed payload shape (`SeedPayload`)
 *   - URL serialization / parsing under the `s_*` namespace
 *   - a pure variant-override helper (`applySeedOverridesToVariant`)
 *   - platform-aware outreach copy (`generateOutreachCopy`)
 *
 * Design rules:
 *   1. All fields are OPTIONAL. When all are absent, `parseSeedPayload`
 *      returns `null` and the surfaces render exactly as before.
 *   2. Parameter names are prefixed `s_` so they never collide with the
 *      existing surface params (`variant`, `source`, `from`, etc.).
 *   3. Override application is PURE. Callers can memoise the result.
 *   4. No backend, no persistence. The /seed page is the only producer.
 */

import type { ResultVariant, ThreatLevel } from '@/lib/result-variants';

export type TargetType = 'creator' | 'brand' | 'meme_account' | 'custom';

export type PlatformPreset =
  | 'none'
  | 'tiktok'
  | 'x'
  | 'instagram'
  | 'reddit'
  | 'discord';

export type SeedSurface = 'report' | 'share' | 'challenge';

export interface SeedPayload {
  /** Display name used as the dossier's `subjectTitle`. */
  targetLabel?: string;
  /** Informational; drives analytics + the operator chip label. */
  targetType?: TargetType;
  /** 0..100 override applied to `powerScore`. */
  powerScore?: number;
  /** Override applied to `threatLevel`. */
  threatLevel?: ThreatLevel;
  /** Index (0..captions.length-1) — caption at this index is featured. */
  captionIndex?: number;
  /** Informational only; not threaded into the variant. */
  platform?: PlatformPreset;
  /**
   * Marker indicating this URL was issued by the seed tool. When true the
   * surfaces can display a "SEEDED" chip. Set by the producer; consumers
   * should not infer it from presence of other fields.
   */
  isSeeded?: boolean;
}

const VALID_TARGET_TYPES: readonly TargetType[] = [
  'creator',
  'brand',
  'meme_account',
  'custom',
];
const VALID_THREATS: readonly ThreatLevel[] = ['Green', 'Amber', 'Red', 'Cerulean'];
const VALID_PLATFORMS: readonly PlatformPreset[] = [
  'none',
  'tiktok',
  'x',
  'instagram',
  'reddit',
  'discord',
];

// ---------------------------------------------------------------------------
// URL serialization
// ---------------------------------------------------------------------------

/**
 * Accept either a stdlib URLSearchParams or the Next.js `searchParams`
 * shape (Record<string, string | string[] | undefined>) so this helper
 * works on both server and client.
 */
type ReadOnlyParams =
  | URLSearchParams
  | Record<string, string | string[] | undefined>
  | null
  | undefined;

function readParam(input: ReadOnlyParams, key: string): string | undefined {
  if (!input) return undefined;
  if (typeof URLSearchParams !== 'undefined' && input instanceof URLSearchParams) {
    const v = input.get(key);
    return v ?? undefined;
  }
  const obj = input as Record<string, string | string[] | undefined>;
  const v = obj[key];
  if (Array.isArray(v)) return v[0];
  return v ?? undefined;
}

/**
 * Parse a seed payload off a request's search params.
 *
 * Returns null when no `s_*` fields are present. Returns a partially
 * populated payload when at least one is. Unknown enum values are
 * dropped silently so a stale link can never crash a surface.
 */
export function parseSeedPayload(input: ReadOnlyParams): SeedPayload | null {
  const mode = readParam(input, 's_mode');
  const targetLabel = readParam(input, 's_target');
  const targetTypeRaw = readParam(input, 's_type');
  const scoreRaw = readParam(input, 's_score');
  const threatRaw = readParam(input, 's_threat');
  const captionRaw = readParam(input, 's_caption');
  const platformRaw = readParam(input, 's_platform');

  const hasAny =
    !!mode ||
    !!targetLabel ||
    !!targetTypeRaw ||
    !!scoreRaw ||
    !!threatRaw ||
    !!captionRaw ||
    !!platformRaw;
  if (!hasAny) return null;

  const payload: SeedPayload = {};

  if (mode === 'seed') payload.isSeeded = true;

  if (targetLabel && targetLabel.trim().length > 0) {
    // Limit to a reasonable display length so a malformed URL can't
    // bleed off the dossier layout.
    payload.targetLabel = targetLabel.trim().slice(0, 80);
  }
  if (targetTypeRaw && (VALID_TARGET_TYPES as readonly string[]).includes(targetTypeRaw)) {
    payload.targetType = targetTypeRaw as TargetType;
  }
  if (scoreRaw) {
    const n = Number.parseInt(scoreRaw, 10);
    if (Number.isFinite(n)) {
      payload.powerScore = Math.min(100, Math.max(0, n));
    }
  }
  if (threatRaw && (VALID_THREATS as readonly string[]).includes(threatRaw)) {
    payload.threatLevel = threatRaw as ThreatLevel;
  }
  if (captionRaw) {
    const n = Number.parseInt(captionRaw, 10);
    if (Number.isFinite(n) && n >= 0) {
      payload.captionIndex = n;
    }
  }
  if (platformRaw && (VALID_PLATFORMS as readonly string[]).includes(platformRaw)) {
    payload.platform = platformRaw as PlatformPreset;
  }

  // If we didn't extract anything meaningful, treat as absent.
  if (Object.keys(payload).length === 0) return null;
  return payload;
}

/**
 * Serialize a payload to URLSearchParams. Only includes keys that have
 * meaningful values, so a default-only payload produces no params at all.
 *
 * Callers should `.forEach((v, k) => target.set(k, v))` rather than
 * concatenating, so the seed params merge cleanly with the surface
 * params already on the link.
 */
export function serializeSeedPayload(payload: SeedPayload): URLSearchParams {
  const params = new URLSearchParams();
  if (payload.isSeeded) params.set('s_mode', 'seed');
  if (payload.targetLabel) params.set('s_target', payload.targetLabel);
  if (payload.targetType) params.set('s_type', payload.targetType);
  if (typeof payload.powerScore === 'number') {
    params.set('s_score', payload.powerScore.toString());
  }
  if (payload.threatLevel) params.set('s_threat', payload.threatLevel);
  if (typeof payload.captionIndex === 'number') {
    params.set('s_caption', payload.captionIndex.toString());
  }
  if (payload.platform && payload.platform !== 'none') {
    params.set('s_platform', payload.platform);
  }
  return params;
}

/**
 * Compose a full URL for a given surface + base variant + payload.
 *
 * The base path comes from the surface ('report' → '/report', etc.).
 * The variant id is added as `?variant=<id>`. The payload is merged in
 * via `serializeSeedPayload`. Existing extra params can be passed via
 * `extras` (e.g. `{ source: 'press' }`).
 */
export function createSeedLink(
  surface: SeedSurface,
  variantId: string,
  payload: SeedPayload,
  extras: Record<string, string> = {},
): string {
  const params = new URLSearchParams({ variant: variantId, ...extras });
  serializeSeedPayload(payload).forEach((value, key) => params.set(key, value));
  const base =
    surface === 'report' ? '/report' : surface === 'share' ? '/share' : '/challenge';
  return `${base}?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Variant override
// ---------------------------------------------------------------------------

/**
 * Apply a seed payload's overrides to a variant. Pure; returns a new
 * variant object when overrides are present, otherwise the original.
 *
 * Override semantics:
 *   - `targetLabel`   → replaces `subjectTitle`.
 *   - `powerScore`    → replaces `powerScore`.
 *   - `threatLevel`   → replaces `threatLevel`.
 *   - `captionIndex`  → rotates the captions array so caption[i] sits at
 *                        index 0 (the "featured" slot used by /share and
 *                        the dossier's primary caption display).
 *
 * Unknown / out-of-range fields are silently ignored so a fresh deploy
 * can't be broken by a saved link with stale parameters.
 */
export function applySeedOverridesToVariant(
  variant: ResultVariant,
  payload: SeedPayload | null,
): ResultVariant {
  if (!payload) return variant;

  let mutated = false;
  let next: ResultVariant = variant;

  if (payload.targetLabel && payload.targetLabel !== variant.subjectTitle) {
    next = { ...next, subjectTitle: payload.targetLabel };
    mutated = true;
  }
  if (
    typeof payload.powerScore === 'number' &&
    payload.powerScore !== variant.powerScore
  ) {
    next = { ...next, powerScore: payload.powerScore };
    mutated = true;
  }
  if (payload.threatLevel && payload.threatLevel !== variant.threatLevel) {
    next = { ...next, threatLevel: payload.threatLevel };
    mutated = true;
  }
  if (
    typeof payload.captionIndex === 'number' &&
    payload.captionIndex > 0 &&
    payload.captionIndex < variant.captions.length
  ) {
    const i = payload.captionIndex;
    next = {
      ...next,
      captions: [
        variant.captions[i],
        ...variant.captions.slice(0, i),
        ...variant.captions.slice(i + 1),
      ] as readonly string[],
    };
    mutated = true;
  }

  return mutated ? next : variant;
}

// ---------------------------------------------------------------------------
// Outreach copy
// ---------------------------------------------------------------------------

/**
 * Produce a platform-flavoured outreach caption the operator can hand to
 * a creator. The Bureau voice is preserved; only the cadence and
 * platform-shaped framing change between presets.
 */
export function generateOutreachCopy(
  payload: SeedPayload,
  variant: ResultVariant,
  surface: SeedSurface,
): string {
  const classification = variant.classification;
  const score = variant.powerScore;
  const threat = variant.threatLevel;
  const target = payload.targetLabel?.trim() || variant.subjectTitle;
  const platform = payload.platform ?? 'none';

  const surfaceWord =
    surface === 'share'
      ? 'share card'
      : surface === 'challenge'
        ? 'challenge dispatch'
        : 'dossier';

  switch (platform) {
    case 'tiktok':
      return `tell me why the bureau filed me as a ${classification.toLowerCase()}. attached: the ${surfaceWord}. score ${score}/100. threat level ${threat.toLowerCase()}.`;

    case 'x':
      return `i regret to inform you that my fart has been ceremonially classified by the Bureau of Acoustic Gasology.\n\nclassification: ${classification}.\nthreat level: ${threat}.\nscore: ${score}/100.`;

    case 'instagram':
      return `filed under: significant.\n\n${classification} \u00B7 score ${score}/100\nthreat level ${threat}\n\nfull ${surfaceWord} attached.`;

    case 'reddit':
      return `[F] The Bureau of Acoustic Gasology issued an official ${surfaceWord} classifying ${target} as a "${classification}". Score ${score}/100, threat level ${threat}. AMA.`;

    case 'discord':
      return `lads. ${target} has been ceremonially classified. ${classification.toUpperCase()} \u00B7 ${score}/100 \u00B7 ${threat.toUpperCase()}. pinning this.`;

    case 'none':
    default:
      // Use the featured caption (after override rotation) when no
      // platform is selected — that's the brand-default voice already.
      return variant.captions[0] ?? `${target} classified as ${classification}.`;
  }
}

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

/**
 * Build a payload from raw operator inputs. The result is always a
 * fully-typed `SeedPayload` ready to be serialised; empty / default
 * inputs simply produce a sparse payload, which is what callers want.
 */
export function createSeedPayload(input: {
  targetLabel?: string;
  targetType?: TargetType;
  powerScore?: number;
  threatLevel?: ThreatLevel;
  captionIndex?: number;
  platform?: PlatformPreset;
}): SeedPayload {
  const payload: SeedPayload = { isSeeded: true };
  if (input.targetLabel && input.targetLabel.trim().length > 0) {
    payload.targetLabel = input.targetLabel.trim().slice(0, 80);
  }
  if (input.targetType) payload.targetType = input.targetType;
  if (typeof input.powerScore === 'number') {
    payload.powerScore = Math.min(100, Math.max(0, Math.round(input.powerScore)));
  }
  if (input.threatLevel) payload.threatLevel = input.threatLevel;
  if (typeof input.captionIndex === 'number' && input.captionIndex >= 0) {
    payload.captionIndex = input.captionIndex;
  }
  if (input.platform && input.platform !== 'none') payload.platform = input.platform;
  return payload;
}

/** A constant array of platform metadata for the picker UI. */
export const PLATFORM_PRESETS: readonly {
  id: PlatformPreset;
  label: string;
  code: string;
  /** Short hint shown beneath the label. */
  hint: string;
}[] = [
  { id: 'none', label: 'No preset', code: '∅', hint: 'Use the brand-default caption.' },
  { id: 'tiktok', label: 'TikTok', code: 'TT', hint: 'Reaction-bait cadence.' },
  { id: 'x', label: 'X', code: 'X', hint: 'Quote-tweet anchor.' },
  { id: 'instagram', label: 'Instagram', code: 'IG', hint: 'Story artifact framing.' },
  { id: 'reddit', label: 'Reddit', code: 'RDT', hint: '"I built this" anchor.' },
  { id: 'discord', label: 'Discord', code: 'DC', hint: 'In-joke drop.' },
];

/** Operator-facing target-type metadata. */
export const TARGET_TYPES: readonly {
  id: TargetType;
  label: string;
  code: string;
}[] = [
  { id: 'creator', label: 'Creator', code: 'CRT' },
  { id: 'brand', label: 'Brand', code: 'BRD' },
  { id: 'meme_account', label: 'Meme account', code: 'MEM' },
  { id: 'custom', label: 'Custom subject', code: 'CST' },
];
