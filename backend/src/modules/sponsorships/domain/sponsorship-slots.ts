/**
 * Native sponsorship inventory — ceremonial fields only.
 * Sponsors never control scoring, classifications, or report truth.
 */

export const SPONSORSHIP_SLOT_CODES = [
  'methane_index_powered_by',
  'sponsored_badge',
  'sponsored_challenge',
  'sponsored_classification',
  'sponsored_probable_cause',
] as const;

export type SponsorshipSlotCode = (typeof SPONSORSHIP_SLOT_CODES)[number];

export function isSponsorshipSlotCode(v: string): v is SponsorshipSlotCode {
  return (SPONSORSHIP_SLOT_CODES as readonly string[]).includes(v);
}

export type SponsorshipCampaignStatus =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'active'
  | 'paused'
  | 'archived';

export interface MethanePoweredByCreative {
  /** Single line, e.g. "National Methane Index · courtesy of …" */
  line: string;
  partnerMark?: string;
  disclosure?: string;
  /** Optional outbound link (click tracked separately). */
  destinationUrl?: string;
}

export interface SponsoredBadgeCreative {
  /** Matches WrappedBadgeDto.id when overlaying a cycle badge. */
  badgeId: string;
  ribbonAppend?: string;
}

export interface SponsoredChallengeCreative {
  supportingLine?: string;
  destinationUrl?: string;
}

export interface SponsoredClassificationCreative {
  targetVariantId: string;
  ceremonialFootnote: string;
}

export interface SponsoredProbableCauseCreative {
  /** Ceremonial line adjacent to probable-cause lore (does not replace report text). */
  ceremonialLine: string;
}

export type SponsorshipCreativePayload =
  | MethanePoweredByCreative
  | SponsoredBadgeCreative
  | SponsoredChallengeCreative
  | SponsoredClassificationCreative
  | SponsoredProbableCauseCreative;

export interface SponsorshipPlacementSurfaceDto {
  slotCode: SponsorshipSlotCode;
  campaignId: string;
  placementId: string;
  sponsorPublicLabel: string;
  /** Sanitised public JSON for the slot (shape varies by slotCode). */
  creative: Record<string, unknown>;
}
