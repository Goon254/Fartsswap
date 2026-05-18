/**
 * Fart Wrapped — typed data model + canonical mock issue.
 *
 * The /fart-wrapped page renders this module verbatim, with optional
 * `?s_target=…&s_score=…&s_threat=…` overrides honoured at the
 * orchestrator. When a real history endpoint lands, the same
 * `WrappedIssue` shape can be returned over the wire and the page
 * won't need to change.
 *
 * SSR/CSR stability: every date is a fixed ISO string. The wrapped
 * cycle is the same for everyone for the duration of the issue.
 */

import type { ThreatLevel } from '@/lib/result-variants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WrappedBadgeTone = 'brass' | 'amber' | 'cerulean' | 'green';

export interface WrappedBadge {
  id: string;
  /** Display code, e.g. "DIST · 01". */
  code: string;
  title: string;
  /** Cycle / award framing line. */
  ribbon: string;
  /** One-line rationale ("Awarded for…"). */
  body: string;
  /** Mock rarity statement; lands as a small footnote on the card. */
  rarity: string;
  tone: WrappedBadgeTone;
  sponsorRibbonAppend?: string;
  sponsorPlacementId?: string;
}

export interface WrappedStoryPanel {
  id: string;
  /** Section code shown in the eyebrow ("CHAPTER · 01"). */
  code: string;
  /** Short label above the headline. */
  label: string;
  /** The display-headline of the panel — what the operator screenshots. */
  headline: string;
  /** Optional numeric / phrase value displayed prominently. */
  value?: string;
  /** Optional unit suffix (mono) — e.g. "/ 100". */
  unit?: string;
  /** Editorial body; full deadpan Bureau sentence. */
  body: string;
  /** Optional bottom-row detail strip (label + value). */
  detail?: { label: string; value: string };
  /** Optional variant id; when present the panel reveals an "Open dossier" link. */
  variantId?: string;
}

export interface ClassificationBreakdownRow {
  classification: string;
  variantId: string;
  /** 0..100 share of cycle filings. */
  share: number;
  count: number;
}

export interface NotableMoment {
  id: string;
  label: string;
  classification: string;
  score: number;
  threatLevel: ThreatLevel;
  caption: string;
  variantId: string;
  issuedAtIso: string;
}

export interface WrappedIssue {
  /** Stable cycle docket, e.g. "WRAPPED-MMXXVI-04412". */
  wrappedCycleId: string;
  /** Display cycle label, e.g. "MMXXVI · ANNUAL REVIEW". */
  cycleLabel: string;
  issuedAtIso: string;

  // — Subject —
  /** Display name; honours `?s_target=` override. */
  subjectLabel: string;
  /** Formal alias used as the dossier id. */
  subjectAlias: string;

  // — Headline stats —
  primaryClassification: string;
  primaryVariantId: string;
  /** Honours `?s_score=` override. */
  averagePowerScore: number;
  /** Honours `?s_threat=` override. */
  dominantThreatLevel: ThreatLevel;

  // — National comparison —
  nationalAverageScore: number;
  percentile: number;
  rankLabel: string;

  // — Editorial highlights —
  topCaption: string;
  topCinematicParallel: string;
  shareHeadline: string;
  closingStatement: string;

  // — Composite blocks —
  storyPanels: readonly WrappedStoryPanel[];
  classificationBreakdown: readonly ClassificationBreakdownRow[];
  notableMoments: readonly NotableMoment[];
  badges: readonly WrappedBadge[];
  /** Peak report in the cycle — used for post-ritual commerce anchors. */
  featuredReportId?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function threatToTone(t: ThreatLevel): 'green' | 'amber' | 'red' | 'cerulean' {
  switch (t) {
    case 'Green':
      return 'green';
    case 'Amber':
      return 'amber';
    case 'Red':
      return 'red';
    case 'Cerulean':
      return 'cerulean';
  }
}

export function formatCycleDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} UTC`;
}

/**
 * Build a screenshot-ready headline summary for the share poster. Pulled
 * out as a helper so the poster + the closing notice can render the same
 * line without drifting.
 */
export function wrappedSummaryLine(issue: WrappedIssue): string {
  return `${issue.primaryClassification} \u00B7 ${issue.averagePowerScore} / 100 \u00B7 ${issue.dominantThreatLevel.toUpperCase()}`;
}

// ---------------------------------------------------------------------------
// Canonical mock issue
// ---------------------------------------------------------------------------

const ISSUED_AT_ISO = '2026-05-18T12:00:00Z';

export const CURRENT_WRAPPED: WrappedIssue = {
  wrappedCycleId: 'WRAPPED-MMXXVI-04412',
  cycleLabel: 'MMXXVI \u00B7 ANNUAL REVIEW',
  issuedAtIso: ISSUED_AT_ISO,

  subjectLabel: 'An anonymous citizen',
  subjectAlias: 'CITIZEN-04412',

  primaryClassification: 'Silent Assassin',
  primaryVariantId: 'silent_assassin',
  averagePowerScore: 73,
  dominantThreatLevel: 'Amber',

  nationalAverageScore: 61.4,
  percentile: 88,
  rankLabel: 'Top 12% of filers, MMXXVI cohort',

  topCaption:
    'I regret to inform you that my fart has been clinically classified.',
  topCinematicParallel: 'A surveillance scene shot through frosted glass',
  shareHeadline: 'Your year in acoustic consequence.',
  closingStatement:
    'The Bureau observed unusual consistency. Further review has been deemed unnecessary but inevitable. Issued for personal record under §0.1 of the Release Provision.',

  // — Six story panels — the chapters of the citizen's year —
  storyPanels: [
    {
      id: 'panel_dominant',
      code: 'CHAPTER · 01',
      label: 'DOMINANT CLASSIFICATION',
      headline: 'Silent Assassin',
      value: '47%',
      unit: 'OF CYCLE FILINGS',
      body: 'Your dominant pattern remained administratively difficult to ignore. The Bureau recorded a strong preference for stealth-class incidents, principally in low-light domestic settings.',
      detail: { label: 'RUNNER-UP', value: 'Velvet Foghorn · 18%' },
      variantId: 'silent_assassin',
    },
    {
      id: 'panel_peak',
      code: 'CHAPTER · 02',
      label: 'PEAK EVENT OF THE CYCLE',
      headline: 'Cerulean Event',
      value: '92',
      unit: '/ 100',
      body: 'A rare blue-spectrum acoustic event recorded on 2026-04-18. Bureau analysts cite atmospheric anomaly and an unusually quiet kitchen.',
      detail: { label: 'FILED', value: '2026-04-18 14:32 UTC' },
      variantId: 'cerulean_event',
    },
    {
      id: 'panel_tone',
      code: 'CHAPTER · 03',
      label: 'EMOTIONAL TONE OF RECORD',
      headline: 'Calculated restraint, with intermittent disclosure.',
      body: 'Year-over-year, your acoustic events trended emotionally composed. The Bureau notes selective release patterns consistent with experienced filers.',
      detail: { label: 'VARIANCE', value: 'Below national median' },
    },
    {
      id: 'panel_parallel',
      code: 'CHAPTER · 04',
      label: 'CINEMATIC PARALLEL OF RECORD',
      headline: 'A surveillance scene shot through frosted glass.',
      body: 'The Cultural Significance desk repeatedly assigned cinematic parallels in the espionage and procedural genres. The Bureau finds the through-line conspicuous.',
      detail: { label: 'GENRE LEAN', value: 'Procedural \u00B7 Surveillance' },
    },
    {
      id: 'panel_cause',
      code: 'CHAPTER · 05',
      label: 'MOST LIKELY CAUSE CLUSTER',
      headline: 'Late-evening legume diplomacy.',
      body: 'Probable-cause clustering indicates a late-evening legume regime sustained across two seasons. The Bureau makes no dietary recommendation.',
      detail: { label: 'OBSERVED', value: '64% of filings · 22:00 \u2013 02:00 UTC' },
    },
    {
      id: 'panel_share',
      code: 'CHAPTER · 06',
      label: 'NOTORIETY INDEX',
      headline: 'Top 12% in cycle shareability.',
      value: '88',
      unit: 'PERCENTILE',
      body: 'Your dossiers travelled. The Office of Press &amp; Diplomatic Correspondence noted disproportionate civilian engagement, particularly in vertical 9:16 formats.',
      detail: { label: 'NATIONAL AVERAGE', value: '50.0 percentile' },
    },
  ],

  // — Compact classification breakdown for the hero card —
  classificationBreakdown: [
    { classification: 'Silent Assassin', variantId: 'silent_assassin', share: 47, count: 41 },
    { classification: 'Velvet Foghorn', variantId: 'velvet_foghorn', share: 18, count: 16 },
    { classification: 'Gaslight Sonata', variantId: 'gaslight_sonata', share: 12, count: 11 },
    { classification: 'Cerulean Event', variantId: 'cerulean_event', share: 9, count: 8 },
    { classification: 'Conference Room Incident', variantId: 'conference_room_incident', share: 7, count: 6 },
    { classification: 'Other', variantId: 'melancholy_jazz_fusion', share: 7, count: 6 },
  ],

  // — Notable moments — small detail rail under the hero —
  notableMoments: [
    {
      id: 'moment_peak',
      label: 'PEAK ACOUSTIC EVENT',
      classification: 'Cerulean Event',
      score: 92,
      threatLevel: 'Cerulean',
      caption: 'A rare blue-spectrum acoustic event recorded under archival conditions.',
      variantId: 'cerulean_event',
      issuedAtIso: '2026-04-18T14:32:00Z',
    },
    {
      id: 'moment_corporate',
      label: 'INCIDENT OF NOTE',
      classification: 'Conference Room Incident',
      score: 87,
      threatLevel: 'Red',
      caption: 'A high-intensity emission recorded inside a glassed enclosure.',
      variantId: 'conference_room_incident',
      issuedAtIso: '2026-02-11T14:02:00Z',
    },
    {
      id: 'moment_debut',
      label: 'FIRST FILING OF CYCLE',
      classification: 'Velvet Foghorn',
      score: 71,
      threatLevel: 'Amber',
      caption: 'A measured emission of theatrical restraint. Bureau recorded discretion.',
      variantId: 'velvet_foghorn',
      issuedAtIso: '2026-01-04T22:17:00Z',
    },
  ],

  // — Four ceremonial distinctions —
  badges: [
    {
      id: 'badge_silent_assassin',
      code: 'DIST · 01',
      title: 'Certified Silent Assassin',
      ribbon: 'BUREAU AWARD · MMXXVI',
      body: 'Awarded for sustained stealth-class consistency across a full annual cycle.',
      rarity: '1 IN 87 FILERS',
      tone: 'green',
    },
    {
      id: 'badge_amber_laureate',
      code: 'DIST · 02',
      title: 'Amber Condition Laureate',
      ribbon: 'OFFICE OF ARTIFACT ISSUANCE · §6.3',
      body: 'Conferred for maintaining elevated severity without escalation to acute filings.',
      rarity: '1 IN 144 FILERS',
      tone: 'amber',
    },
    {
      id: 'badge_resonance',
      code: 'DIST · 03',
      title: 'Departmental Notice of Resonance',
      ribbon: 'DEPARTMENT OF CULTURAL SIGNIFICANCE · §5.7',
      body: 'Issued in recognition of recurring cinematic parallels and disciplined emotional tone.',
      rarity: '1 IN 312 FILERS',
      tone: 'brass',
    },
    {
      id: 'badge_citizen_quarter',
      code: 'DIST · 04',
      title: 'Acoustic Citizen of the Quarter',
      ribbon: 'STATION OPS-04 · Q1 / MMXXVI',
      body: 'Recognised for exceptional shareability and consistent civic decorum during release.',
      rarity: '1 IN 41 FILERS',
      tone: 'cerulean',
    },
  ],
  featuredReportId: '00000000-0000-4000-8000-000000000001',
};
