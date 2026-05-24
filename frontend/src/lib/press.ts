/**
 * Press / media kit constants.
 *
 * Treated as if a real comms desk had drafted them: deadpan dateline, fixed
 * docket, three institutional quotes, an embargo lifted on the same target
 * the Release Bulletin counts down to. Everything is plain data so the
 * page itself stays a thin renderer.
 *
 * No PII, no real contacts. The media-contact strings below are part of the
 * bit; they should not route anywhere real until a press inbox exists.
 */

import { RELEASE_TARGET_ISO } from '@/lib/launch-mode';

/**
 * The press release issuance date. Hard-coded so SSR and CSR agree on
 * a single string — never re-derive from `new Date()`.
 */
export const PRESS_ISSUE_DATE_ISO = '2026-05-18T12:00:00Z';
export const PRESS_ISSUE_DATE_DISPLAY = 'STATION OPS-04 · 18 MAY 2026';

/** Mirror the launch-shell countdown target so the world stays coherent. */
export const PRESS_EMBARGO_ISO = RELEASE_TARGET_ISO;

/** The visible docket. Appears in the press header, the URL of fact sheet packets, etc. */
export const PRESS_DOCKET = 'PR-MMXXVI-00081';

/** Media contact strings. Part of the institutional bit; nothing is wired. */
export const PRESS_CONTACT = {
  email: 'press@bag.gov',
  phone: '+1 (504) 343-5677',
  desk: 'Desk §9.1 · Press & Diplomatic Correspondence',
  address: 'Station OPS-04, Bureau of Acoustic Gasology, MMXXVI',
} as const;

/** Stable identifiers used by analytics. */
export type PressContactKind = 'press_desk' | 'media_email' | 'media_phone' | 'archive_request';

// ---------------------------------------------------------------------------
// Boilerplate quotes
// ---------------------------------------------------------------------------

export interface PressQuote {
  id: string;
  role: string;
  attribution: string;
  body: string;
}

export const PRESS_QUOTES: readonly PressQuote[] = [
  {
    id: 'methane',
    attribution: 'Dr. L. Methane',
    role: 'Director of Acoustic Review',
    body:
      'The opening of the public filing line completes a multi-quarter program of acoustic intake reform. We are now positioned to process civilian submissions at population scale, without compromise to ceremonial standards.',
  },
  {
    id: 'velvetine',
    attribution: 'A. Velvetine',
    role: 'Chief Emissions Officer',
    body:
      'Documentation of an acoustic event has historically been ad hoc, anecdotal, and largely unsealed. With today\u2019s release the artifact itself becomes the record. Sharing responsibly is, for the first time, operationally possible.',
  },
  {
    id: 'krakatoa',
    attribution: 'R. Krakatoa',
    role: 'Acting Archivist, Bureau of Acoustic Gasology',
    body:
      'Each issued dossier carries a serialised filing number and a tamper-evident hash. The Bureau intends to honour the founding ledger in strict filing order, regardless of attention or volume.',
  },
];

// ---------------------------------------------------------------------------
// Media fact sheet
// ---------------------------------------------------------------------------

export interface MediaFact {
  id: string;
  label: string;
  value: string;
  /** Optional short footnote shown below the value. */
  note?: string;
}

export const MEDIA_FACTS: readonly MediaFact[] = [
  {
    id: 'launch_status',
    label: 'LAUNCH STATUS',
    value: 'Private beta · widening',
    note: 'Founding designations admitted under §0.1',
  },
  {
    id: 'artifact_types',
    label: 'ARTIFACT TYPES',
    value: 'Dossier · share card · challenge notice · public feed',
    note: 'Issued under §6.3 (Artifact Issuance)',
  },
  {
    id: 'challenge_mechanism',
    label: 'CHALLENGE MECHANISM',
    value: 'Ceremonial dispute via signed link',
    note: 'Sender / recipient perspectives recognised',
  },
  {
    id: 'recording_ceiling',
    label: 'RECORDING CEILING',
    value: 'Ten seconds per acoustic sample',
    note: 'Standard ten-second filing ceiling, §4.2',
  },
  {
    id: 'distribution',
    label: 'DISTRIBUTION CHANNELS',
    value: 'Web (fartsswap.com) · press desk · diplomatic correspondence',
  },
  {
    id: 'press_desk',
    label: 'PRESS DESK',
    value: PRESS_CONTACT.desk,
    note: 'Accredited correspondents only',
  },
  {
    id: 'embargo',
    label: 'EMBARGO',
    value: 'Lifted on public filing day',
    note: 'See Bulletin № 7 / 7',
  },
];

// ---------------------------------------------------------------------------
// Sample asset gallery
// ---------------------------------------------------------------------------

export type PressAssetType = 'dossier' | 'share_card' | 'challenge_notice' | 'public_feed';

export interface PressAsset {
  id: string;
  /** Display label, e.g. "EXHIBIT A · DOSSIER". */
  exhibit: string;
  type: PressAssetType;
  name: string;
  /** One-line press caption explaining what the asset shows. */
  caption: string;
  /** Where journalists can view the live artifact. */
  liveUrl: string;
  /** What the "Copy reference" button writes to the clipboard. */
  reference: string;
  /** Optional ratio hint for the thumbnail (CSS aspect-ratio value). */
  aspect: string;
}

const SAMPLE_VARIANT = 'velvet_foghorn';

export const PRESS_ASSETS: readonly PressAsset[] = [
  {
    id: 'asset_dossier',
    exhibit: 'EXHIBIT A',
    type: 'dossier',
    name: 'Sample Dossier · Velvet Foghorn',
    caption:
      'Standard issue dossier. Classification, power score, threat level, and cinematic parallel are rendered as recorded.',
    liveUrl: `/report?variant=${SAMPLE_VARIANT}&from=press`,
    reference: 'BAG-2026-04412 · fart_8c1d4a92ef6b7a5d',
    aspect: '16 / 11',
  },
  {
    id: 'asset_share_card',
    exhibit: 'EXHIBIT B',
    type: 'share_card',
    name: 'Vertical Share Card · 9:16',
    caption:
      'Share-card output as exported by the client. Engineered for hand-held viewing surfaces and bilateral redistribution.',
    liveUrl: `/share?variant=${SAMPLE_VARIANT}&from=press`,
    reference: 'SHARE · 1080×1920 · vertical',
    aspect: '9 / 16',
  },
  {
    id: 'asset_challenge_notice',
    exhibit: 'EXHIBIT C',
    type: 'challenge_notice',
    name: 'Challenge Notice · Dispute Filed',
    caption:
      'Send-to-friend challenge surface. Renders sender / recipient perspectives without ambiguity.',
    liveUrl: `/challenge?variantId=${SAMPLE_VARIANT}&score=73&type=beat_score&surface=share`,
    reference: 'CHL-MMXXVI · ceremonial dispute',
    aspect: '16 / 10',
  },
  {
    id: 'asset_public_feed',
    exhibit: 'EXHIBIT D',
    type: 'public_feed',
    name: 'Public Feed · Moderated Gallery',
    caption:
      'Opt-in specimens published after operator review. Ranked by power score with Bureau classification labels.',
    liveUrl: '/feed',
    reference: 'FEED · moderated · opt-in only',
    aspect: '16 / 11',
  },
];

// ---------------------------------------------------------------------------
// Formatted strings
// ---------------------------------------------------------------------------

export function formatPressDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} · ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}

/**
 * Format a quote for clipboard. Press desks expect the body in quotes
 * followed by an em-dash attribution + role; mirror that exactly.
 */
export function serializeQuote(q: PressQuote): string {
  return `\u201C${q.body}\u201D \u2014 ${q.attribution}, ${q.role}`;
}

/** Format a media fact for clipboard ("LABEL: value"). */
export function serializeFact(f: MediaFact): string {
  return f.note ? `${f.label}: ${f.value} (${f.note})` : `${f.label}: ${f.value}`;
}
