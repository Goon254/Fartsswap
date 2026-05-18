/** Aligned with `frontend/src/lib/fart-wrapped.ts`. */

export type WrappedBadgeToneDto = 'brass' | 'amber' | 'cerulean' | 'green';
export type ThreatLevelDto = 'Green' | 'Amber' | 'Red' | 'Cerulean';

export interface WrappedBadgeDto {
  id: string;
  code: string;
  title: string;
  ribbon: string;
  body: string;
  rarity: string;
  tone: WrappedBadgeToneDto;
  /** Ceremonial sponsor ribbon append (does not replace badge body). */
  sponsorRibbonAppend?: string;
  sponsorPlacementId?: string;
}

export interface WrappedStoryPanelDto {
  id: string;
  code: string;
  label: string;
  headline: string;
  value?: string;
  unit?: string;
  body: string;
  detail?: { label: string; value: string };
  variantId?: string;
}

export interface ClassificationBreakdownRowDto {
  classification: string;
  variantId: string;
  share: number;
  count: number;
}

export interface NotableMomentDto {
  id: string;
  label: string;
  classification: string;
  score: number;
  threatLevel: ThreatLevelDto;
  caption: string;
  variantId: string;
  issuedAtIso: string;
}

export interface WrappedIssueDto {
  wrappedCycleId: string;
  cycleLabel: string;
  issuedAtIso: string;
  subjectLabel: string;
  subjectAlias: string;
  primaryClassification: string;
  primaryVariantId: string;
  averagePowerScore: number;
  dominantThreatLevel: ThreatLevelDto;
  nationalAverageScore: number;
  percentile: number;
  rankLabel: string;
  topCaption: string;
  topCinematicParallel: string;
  shareHeadline: string;
  closingStatement: string;
  storyPanels: readonly WrappedStoryPanelDto[];
  classificationBreakdown: readonly ClassificationBreakdownRowDto[];
  notableMoments: readonly NotableMomentDto[];
  badges: readonly WrappedBadgeDto[];
  /** Peak-power report in the cycle — commerce / deep-link anchor. */
  featuredReportId: string;
}

export type RitualProvenanceDto = 'live' | 'low_volume' | 'canonical_fallback';

export interface WrappedSponsorshipPlacementDto {
  slotCode: string;
  campaignId: string;
  placementId: string;
  sponsorPublicLabel: string;
  creative: Record<string, unknown>;
}

export interface WrappedEnvelopeDto {
  provenance: RitualProvenanceDto;
  /** Cohort window used for national average / percentiles. */
  cohortYear: number;
  issue: WrappedIssueDto | null;
  sponsorship?: { placements: readonly WrappedSponsorshipPlacementDto[] };
}
