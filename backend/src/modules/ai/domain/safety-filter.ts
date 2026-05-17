/**
 * Content safety + normalisation pass for AI-generated report fields.
 *
 * The orchestrator runs this AFTER schema validation and BEFORE persistence.
 * It is intentionally simple and rule-based — no external API calls — so it
 * can never become the bottleneck or the failure mode.
 *
 * Rules:
 *   1. Whitespace + control characters are normalised.
 *   2. HTML/markup characters are escaped at the boundary (string fields are
 *      rendered into the share card HTML downstream; defence in depth).
 *   3. A small disallowed-terms list scrubs categories the brand cannot
 *      tolerate (sexual, slur, hateful, graphic, real-person targeting).
 *      Matches are replaced wholesale with the safe default — never
 *      partially scrubbed — so the result is never a leaky redaction.
 *   4. Length caps are enforced per field.
 *
 * Brand stance (kept in code so reviewers can read it):
 *   - Absurd, official-sounding, clinical parody is the voice.
 *   - PG-13. No body-fluid description, no anatomy beyond "acoustic / digestive",
 *     no targeted cruelty, no slurs, no fetish framing, no real names.
 */

export interface SanitizeOptions {
  /** Per-field length cap; truncation happens after sanitisation. */
  maxLength: number;
  /** Replacement value used when the input is empty / disallowed / unsalvageable. */
  fallback: string;
}

const DISALLOWED_PATTERNS: RegExp[] = [
  // sexual / fetish
  /\b(?:sex(?:y|ual|ualis(?:e|ed)|ualiz(?:e|ed))?|porn|nsfw|kink|fetish|erotic|orgasm|nude|naked|breast|nipple|genital|penis|vagina|anus(?!\w)|anal\b|butthole|pussy|cock\b|dick\b|boob|tit\b|tits|horny|arous(?:e|ed|ing)|lust|seduc(?:e|tive))\b/i,
  // body-fluid / graphic gross-out
  /\b(?:shit\b|shitting|crap\b|crapping|poop(?:ed|ing|y)?|piss\b|pissing|urine|vomit|puke|diarr?hea|defecat(?:e|ed|ion)|fecal|feces|excrement|bloody)\b/i,
  // slurs / hate / cruelty (broad-net; deliberately not exhaustive — model + filter pair)
  /\b(?:slur|retard(?:ed)?|faggot|tranny|chink|spic\b|kike|wetback|nigger|gook|towelhead|raghead|cripple)\b/i,
  // medical / regulated claims (parody product must not pretend to diagnose)
  /\b(?:diagnos(?:e|ed|is|tic medical)|medical advice|prescription|cure[sd]?\b|disease\b|infect(?:ed|ion)|cancer\b|covid|pregnan(?:t|cy))\b/i,
  // self-harm / violence
  /\b(?:suicid(?:e|al)|kill yourself|murder|terrorist|bomb\b|shoot up|stab(?:bed|bing)?)\b/i,
];

/**
 * Returns true if `value` contains any disallowed term. The caller substitutes
 * `fallback` wholesale — we never half-redact, because a redacted line on the
 * share card looks worse than the deterministic backup line.
 */
export function containsDisallowedContent(value: string): boolean {
  return DISALLOWED_PATTERNS.some((rx) => rx.test(value));
}

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;
const COLLAPSING_WS = /\s+/g;

export function sanitizeString(raw: unknown, opts: SanitizeOptions): string {
  if (typeof raw !== 'string') {
    return opts.fallback;
  }
  let v = raw.replace(CONTROL_CHARS, ' ').replace(COLLAPSING_WS, ' ').trim();
  if (!v) {
    return opts.fallback;
  }
  if (containsDisallowedContent(v)) {
    return opts.fallback;
  }
  if (v.length > opts.maxLength) {
    v = v.slice(0, opts.maxLength).trimEnd();
    // Avoid trailing punctuation half-truncated mid-word.
    v = v.replace(/[\s,.;:!?-]+$/u, '');
  }
  return v.length > 0 ? v : opts.fallback;
}

/**
 * Numeric clamp + integer coercion. Used for `powerScore`.
 * Out-of-range / NaN values fall back to the deterministic seed value.
 */
export function sanitizeIntegerInRange(
  raw: unknown,
  range: { min: number; max: number; fallback: number },
): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) {
    return range.fallback;
  }
  const rounded = Math.round(raw);
  if (rounded < range.min) return range.min;
  if (rounded > range.max) return range.max;
  return rounded;
}
