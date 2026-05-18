/**
 * National Methane Index — typed data model + mock issue.
 *
 * The /methane-index page renders this module verbatim. When a real
 * issuance backend lands, the same `MethaneIndexIssue` shape will come
 * over the wire and the page won't need to change.
 *
 * SSR/CSR stability: every date in this file is a fixed ISO string so
 * the server and client paint the same bulletin regardless of viewer
 * clock. The bulletin is the same for everyone for the duration of the
 * issue.
 */

import type { ThreatLevel } from '@/lib/result-variants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Movement = 'up' | 'down' | 'flat' | 'volatile' | 'new';
export type SeverityBand = 'green' | 'amber' | 'red' | 'cerulean';

export interface HeadlineMetric {
  id: string;
  /** Eyebrow label shown above the value. */
  label: string;
  /** The big number / phrase. */
  value: string;
  /** Optional unit suffix shown beside the value in mono. */
  unit?: string;
  /** Optional movement indicator (for index-like deltas). */
  trend?: { direction: 'up' | 'down' | 'flat'; delta: string };
  /** Optional one-liner shown beneath the value. */
  hint?: string;
  /** Colour band for the metric chip. */
  tone?: 'brass' | 'amber' | 'green' | 'red' | 'cerulean' | 'neutral';
}

export interface ClassificationRow {
  id: string;
  rank: number;
  classification: string;
  /** The base variant this row links to via `/report?variant=<id>`. */
  variantId: string;
  /** 0..100 rolling weekly score (mock). */
  weeklyScore: number;
  /** Movement direction in the index. */
  movement: Movement;
  /** Display delta e.g. "+12.4%", "±9.2%", "—". */
  movementDelta: string;
  /** Severity band; drives the chip tone. */
  severity: SeverityBand;
  /** Underlying Bureau threat level (matches /report). */
  threatLevel: ThreatLevel;
  /** Mock filings under review this week. */
  weeklyVolume: number;
  /** 0..100 shareability score (mock). */
  shareability: number;
  /** One-line Bureau commentary for this row. */
  note: string;
  /** Optional warning ribbon (e.g. NEW · DEBUT). */
  warning?: string;
}

export interface BureauCommentaryLine {
  id: string;
  body: string;
  attribution: string;
  /** Optional eyebrow (e.g. "EDITORIAL · OPEN"). */
  eyebrow?: string;
}

export interface FeaturedArtifact {
  /** Variant to base the artifact on; rendered honourably on the page. */
  variantId: string;
  classification: string;
  /** The deadpan public-record subject ascribed to the day's honoree. */
  subjectTitle: string;
  /** Mock score on display (allowed to differ from the variant's base). */
  powerScore: number;
  /** Featured caption shown in the artifact card. */
  caption: string;
  /** Mock hash to display under the artifact. */
  reportHash: string;
  /** The Bureau's framing eyebrow ("TODAY'S BUREAU SELECTION", etc.). */
  honorific: string;
  /** Threat level shown on the artifact chip. */
  threatLevel: ThreatLevel;
}

export interface RitualTeaserItem {
  id: string;
  code: string;
  title: string;
  body: string;
  /** Status microcopy. */
  hint: string;
  /** Optional deep link target — defaults to "#" if absent. */
  href?: string;
  available: boolean;
}

export interface ArchivalNote {
  id: string;
  label: string;
  value: string;
}

export interface MethaneIndexIssue {
  /** Stable docket id, e.g. "MX-MMXXVI-020". */
  issueId: string;
  /** Display number, e.g. "020". */
  issueNumber: string;
  /** Week label, e.g. "WEEK 20 · MMXXVI". */
  weekLabel: string;
  /** ISO issue date. */
  issuedAtIso: string;
  /** Issuing department. */
  department: string;
  title: string;
  subtitle: string;
  threatClimate: SeverityBand;
  threatClimateLabel: string;
  headlineMetrics: readonly HeadlineMetric[];
  classifications: readonly ClassificationRow[];
  featured: FeaturedArtifact;
  commentary: readonly BureauCommentaryLine[];
  archivalNotes: readonly ArchivalNote[];
  rituals: readonly RitualTeaserItem[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function severityChipTone(s: SeverityBand): 'green' | 'amber' | 'red' | 'cerulean' {
  switch (s) {
    case 'green':
      return 'green';
    case 'amber':
      return 'amber';
    case 'red':
      return 'red';
    case 'cerulean':
      return 'cerulean';
  }
}

export function movementLabel(m: Movement): string {
  switch (m) {
    case 'up':
      return 'ADVANCING';
    case 'down':
      return 'RECEDING';
    case 'flat':
      return 'HOLDING';
    case 'volatile':
      return 'VOLATILE';
    case 'new':
      return 'DEBUT';
  }
}

export function movementTone(m: Movement): 'green' | 'red' | 'amber' | 'brass' | 'neutral' {
  switch (m) {
    case 'up':
      return 'green';
    case 'down':
      return 'red';
    case 'flat':
      return 'neutral';
    case 'volatile':
      return 'amber';
    case 'new':
      return 'brass';
  }
}

export function formatIssueDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} UTC`;
}

// ---------------------------------------------------------------------------
// Canonical mock issue
// ---------------------------------------------------------------------------

const ISSUED_AT_ISO = '2026-05-18T12:00:00Z';

export const CURRENT_ISSUE: MethaneIndexIssue = {
  issueId: 'MX-MMXXVI-020',
  issueNumber: '020',
  weekLabel: 'WEEK 20 · MMXXVI',
  issuedAtIso: ISSUED_AT_ISO,
  department: 'DEPARTMENT OF CLASSIFICATION INTELLIGENCE',
  title: 'National Methane Index',
  subtitle:
    'Weekly classification movement, featured acoustic events, and provisional advisories. Filed for national review.',
  threatClimate: 'amber',
  threatClimateLabel: 'AMBER · ELEVATED',

  // — Hero metric rail —
  headlineMetrics: [
    {
      id: 'dominant',
      label: 'DOMINANT CLASSIFICATION',
      value: 'Cerulean Event',
      hint: 'Outperformed on severity and memorability.',
      tone: 'cerulean',
    },
    {
      id: 'avg_score',
      label: 'AVERAGE POWER SCORE',
      value: '61.4',
      unit: '/ 100',
      trend: { direction: 'up', delta: '+3.2 W/W' },
      hint: 'Modest advance off last week\u2019s sub-60 baseline.',
      tone: 'brass',
    },
    {
      id: 'climate',
      label: 'THREAT CLIMATE',
      value: 'Amber',
      hint: 'Elevated. Civilian filings should proceed with composure.',
      tone: 'amber',
    },
    {
      id: 'advisory',
      label: 'FEATURED ADVISORY',
      value: 'Caution advised',
      hint: 'Movement clusters concentrated in mid-severity bands.',
      tone: 'amber',
    },
    {
      id: 'volume',
      label: 'EVENTS UNDER REVIEW',
      value: '4,118',
      trend: { direction: 'up', delta: '+612 W/W' },
      hint: 'New material received from 47 jurisdictions.',
      tone: 'brass',
    },
  ],

  // — Classification movers —
  classifications: [
    {
      id: 'cerulean_event',
      rank: 1,
      classification: 'Cerulean Event',
      variantId: 'cerulean_event',
      weeklyScore: 89,
      movement: 'up',
      movementDelta: '+12.4%',
      severity: 'cerulean',
      threatLevel: 'Cerulean',
      weeklyVolume: 612,
      shareability: 94,
      note: 'Outperformed on severity and memorability. Bureau notes sustained civilian attention.',
    },
    {
      id: 'velvet_foghorn',
      rank: 2,
      classification: 'Velvet Foghorn',
      variantId: 'velvet_foghorn',
      weeklyScore: 78,
      movement: 'up',
      movementDelta: '+8.1%',
      severity: 'amber',
      threatLevel: 'Amber',
      weeklyVolume: 540,
      shareability: 86,
      note: 'Continued strength following late-session resonance. Upholstery-adjacent filings concentrated.',
    },
    {
      id: 'gaslight_sonata',
      rank: 3,
      classification: 'Gaslight Sonata',
      variantId: 'gaslight_sonata',
      weeklyScore: 71,
      movement: 'up',
      movementDelta: '+5.6%',
      severity: 'amber',
      threatLevel: 'Amber',
      weeklyVolume: 488,
      shareability: 81,
      note: 'Demand for explanatory commentary remains elevated. Editorial volume noted.',
    },
    {
      id: 'silent_assassin',
      rank: 4,
      classification: 'Silent Assassin',
      variantId: 'silent_assassin',
      weeklyScore: 63,
      movement: 'flat',
      movementDelta: '+0.3%',
      severity: 'green',
      threatLevel: 'Green',
      weeklyVolume: 420,
      shareability: 74,
      note: 'Holding cleanly. Stealth filings continue to outpace witness-class incidents.',
    },
    {
      id: 'the_philosopher',
      rank: 5,
      classification: 'The Philosopher',
      variantId: 'the_philosopher',
      weeklyScore: 58,
      movement: 'volatile',
      movementDelta: '\u00B19.2%',
      severity: 'amber',
      threatLevel: 'Amber',
      weeklyVolume: 391,
      shareability: 69,
      note: 'Wide intraday range. Bureau attributes movement to seasonal contemplation.',
    },
    {
      id: 'bass_boosted_bureaucrat',
      rank: 6,
      classification: 'Bass-Boosted Bureaucrat',
      variantId: 'bass_boosted_bureaucrat',
      weeklyScore: 55,
      movement: 'new',
      movementDelta: 'DEBUT',
      severity: 'red',
      threatLevel: 'Red',
      weeklyVolume: 287,
      shareability: 88,
      note: 'New entrant. Civilian commentary disproportionately favourable; calendars affected.',
      warning: 'NEW · DEBUT',
    },
    {
      id: 'melancholy_jazz_fusion',
      rank: 7,
      classification: 'Melancholy Jazz Fusion',
      variantId: 'melancholy_jazz_fusion',
      weeklyScore: 51,
      movement: 'down',
      movementDelta: '\u22122.4%',
      severity: 'amber',
      threatLevel: 'Amber',
      weeklyVolume: 244,
      shareability: 66,
      note: 'Receding modestly after a multi-week ascent. The genre remains structurally intact.',
    },
    {
      id: 'conference_room_incident',
      rank: 8,
      classification: 'Conference Room Incident',
      variantId: 'conference_room_incident',
      weeklyScore: 47,
      movement: 'down',
      movementDelta: '\u22126.8%',
      severity: 'red',
      threatLevel: 'Red',
      weeklyVolume: 218,
      shareability: 73,
      note: 'Retreated after an overextended Q3-tier opening. The Bureau counsels seasonal patience.',
    },
  ],

  // — Featured artifact (Fart of the Day) —
  featured: {
    variantId: 'cerulean_event',
    classification: 'Cerulean Event',
    subjectTitle: 'An anonymous citizen of Vienna, last Tuesday',
    powerScore: 91,
    caption:
      'A rare blue-spectrum acoustic event recorded under archival conditions. Filed for national review.',
    reportHash: 'fart_5f17a902ce4c1b6e',
    honorific: "TODAY'S BUREAU SELECTION · FART OF THE DAY",
    threatLevel: 'Cerulean',
  },

  // — Editorial commentary —
  commentary: [
    {
      id: 'open',
      eyebrow: 'EDITORIAL · §I',
      body: 'Index conditions remain volatile. Cerulean Event continues to outperform on both severity and memorability. The Bureau advises calm while classification pressure remains elevated.',
      attribution: 'Dr. L. Methane, Director of Acoustic Review',
    },
    {
      id: 'movers',
      eyebrow: 'EDITORIAL · §II',
      body: 'Conference Room Incident retreated after an overextended opening. Bureau analysts attribute the move to seasonal calendar reorganisation and a sharp decline in pre-meeting legume consumption.',
      attribution: 'A. Velvetine, Chief Emissions Officer',
    },
    {
      id: 'debuts',
      eyebrow: 'EDITORIAL · §III',
      body: 'Bass-Boosted Bureaucrat debuts at № VI and arrives with civilian commentary disproportionately favourable. The Bureau notes structural similarities to historical entrants from MMXIX.',
      attribution: 'R. Krakatoa, Acting Archivist',
    },
    {
      id: 'closing',
      eyebrow: 'EDITORIAL · §IV',
      body: 'Threat climate remains provisionally amber. The Methane Index will reissue on or before the following acoustic Monday.',
      attribution: 'Bureau Editorial Board',
    },
  ],

  // — Archival notes —
  archivalNotes: [
    { id: 'an_a', label: 'TOP CLASSIFICATION · YEAR-TO-DATE', value: 'Cerulean Event · 7 weekly wins' },
    { id: 'an_b', label: 'MOST UNSTABLE CYCLE · MMXXVI', value: 'The Philosopher · ±14.6% mean range' },
    { id: 'an_c', label: 'ARCHIVE INTAKE · QUARTER', value: '54,902 dossiers \u00B7 12 cultural commendations' },
  ],

  // — Ritual teasers —
  rituals: [
    {
      id: 'fart_wrapped',
      code: 'RITUAL · ANNUAL',
      title: 'Fart Wrapped',
      body: 'Year-end ceremonial review of each citizen\u2019s personal acoustic ledger. Designations of merit issued to long-tenured filers.',
      hint: 'COMPILES · WEEK 52 \u00B7 MMXXVI',
      available: false,
    },
    {
      id: 'all_time_archive',
      code: 'RITUAL · ARCHIVE',
      title: 'All-Time Classification Archive',
      body: 'Browse historic classification movement back to the inaugural issue. Currently held under §0.1 of the Release Provision.',
      hint: 'OPENS WITH PUBLIC FILING LINE',
      available: false,
    },
    {
      id: 'methane_almanac',
      code: 'RITUAL · SUBSCRIPTION',
      title: 'Methane Almanac',
      body: 'Weekly delivery of the Index direct to your correspondence channel. Includes the full classification movers ledger.',
      hint: 'OPENS POST-LAUNCH',
      available: false,
    },
  ],
};
