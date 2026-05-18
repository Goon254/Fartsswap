/**
 * JSON shapes for /methane-index API — aligned with `frontend/src/lib/methane-index.ts`.
 * Keep field names stable for the public ritual surface.
 */

export type MovementDto = 'up' | 'down' | 'flat' | 'volatile' | 'new';
export type SeverityBandDto = 'green' | 'amber' | 'red' | 'cerulean';
export type ThreatLevelDto = 'Green' | 'Amber' | 'Red' | 'Cerulean';

export interface HeadlineMetricDto {
  id: string;
  label: string;
  value: string;
  unit?: string;
  trend?: { direction: 'up' | 'down' | 'flat'; delta: string };
  hint?: string;
  tone?: 'brass' | 'amber' | 'green' | 'red' | 'cerulean' | 'neutral';
}

export interface ClassificationRowDto {
  id: string;
  rank: number;
  classification: string;
  variantId: string;
  weeklyScore: number;
  movement: MovementDto;
  movementDelta: string;
  severity: SeverityBandDto;
  threatLevel: ThreatLevelDto;
  weeklyVolume: number;
  shareability: number;
  note: string;
  warning?: string;
  /** Ceremonial sponsor footnote — does not change index math. */
  sponsorFootnote?: string;
  sponsorPlacementId?: string;
}

export interface BureauCommentaryLineDto {
  id: string;
  body: string;
  attribution: string;
  eyebrow?: string;
}

export interface FeaturedArtifactDto {
  variantId: string;
  classification: string;
  subjectTitle: string;
  powerScore: number;
  caption: string;
  reportHash: string;
  honorific: string;
  threatLevel: ThreatLevelDto;
  /** When present, links may prefer slug-based dossier routes later. */
  publicSlug?: string;
  reportId?: string;
  /** Ceremonial probable-cause sponsor line (adjacent copy only). */
  sponsorProbableCauseLine?: string;
  sponsorProbableCausePlacementId?: string;
}

export interface RitualTeaserItemDto {
  id: string;
  code: string;
  title: string;
  body: string;
  hint: string;
  href?: string;
  available: boolean;
}

export interface ArchivalNoteDto {
  id: string;
  label: string;
  value: string;
}

export interface MethaneIndexIssueDto {
  issueId: string;
  issueNumber: string;
  weekLabel: string;
  issuedAtIso: string;
  department: string;
  title: string;
  subtitle: string;
  threatClimate: SeverityBandDto;
  threatClimateLabel: string;
  headlineMetrics: readonly HeadlineMetricDto[];
  classifications: readonly ClassificationRowDto[];
  featured: FeaturedArtifactDto;
  commentary: readonly BureauCommentaryLineDto[];
  archivalNotes: readonly ArchivalNoteDto[];
  rituals: readonly RitualTeaserItemDto[];
}

export type RitualProvenanceDto = 'live' | 'low_volume' | 'canonical_fallback';

export interface SponsorshipPlacementPublicDto {
  slotCode: string;
  campaignId: string;
  placementId: string;
  sponsorPublicLabel: string;
  creative: Record<string, unknown>;
}

export interface MethaneIndexEnvelopeDto {
  provenance: RitualProvenanceDto;
  window: { startIso: string; endIso: string; label: string };
  /** Present when live / low_volume so clients can attribute featured selection. */
  featuredReportId?: string;
  issue: MethaneIndexIssueDto | null;
  /** Active ceremonial placements for this response (may be empty). */
  sponsorship?: { placements: readonly SponsorshipPlacementPublicDto[] };
}

export interface MethaneIndexHistoryDto {
  entries: readonly MethaneIndexEnvelopeDto[];
}
