/**
 * Frontend-only premium offer catalog.
 *
 * No payments, no order management, no entitlements. This file just types
 * the offers and supplies mock copy + pricing so the upsell scaffold has
 * something to render. When checkout lands, the same shape can come from
 * an API — `available` flips to true, `priceLabel` becomes a formatted
 * money string, `ctaLabel` becomes "Buy" / "Order", etc.
 */

export type OfferType =
  | 'pdf_certificate'
  | 'wall_certificate'
  | 'theme_pack'
  | 'roast_mode';

export type OfferBadge =
  | 'MOST OFFICIAL'
  | 'MOST GIFTABLE'
  | 'BEST FOR SCREENSHOTS'
  | 'MOST TARGETED';

export interface PremiumOffer {
  id: string;
  type: OfferType;
  name: string;
  /** One-line product description, shown under the title. */
  description: string;
  /** "Why it exists" line — the brand-voice rationale. */
  rationale: string;
  /** Display price string. Includes "$" + caveat ("early access", "starts at"). */
  priceLabel: string;
  /** Short uppercase badge shown in the top-right of the card. Optional. */
  badge?: OfferBadge;
  /** Mock — always false until payments land. Drives the CTA wording. */
  available: boolean;
  /** Button label, varies with availability. */
  ctaLabel: string;
}

/**
 * The four canonical offers shown on /premium. Order here is presentation
 * order on the page: PDF first (the centrepiece), wall second (the gift
 * angle), then the two secondary bundles.
 */
export const PREMIUM_OFFERS: readonly PremiumOffer[] = [
  {
    id: 'pdf_certificate_v1',
    type: 'pdf_certificate',
    name: 'Official PDF Certificate',
    description:
      'An archival, A4-formatted dossier with full ceremonial framing, signed seal, and a serialised filing number.',
    rationale:
      'For events of documented significance. Print at any size; the watermark scales.',
    priceLabel: '$4 · early access',
    badge: 'MOST OFFICIAL',
    available: false,
    ctaLabel: 'Join early access',
  },
  {
    id: 'wall_certificate_v1',
    type: 'wall_certificate',
    name: 'Printable Wall Certificate',
    description:
      'A landscape-format printable certificate engineered for framing. Shipped digitally; printable at home or at a frame shop.',
    rationale:
      'Suitable for desks, hallways, and the kind of household where a fart is considered news.',
    priceLabel: '$19 · pre-order',
    badge: 'MOST GIFTABLE',
    available: false,
    ctaLabel: 'Notify me on launch',
  },
  {
    id: 'theme_pack_v1',
    type: 'theme_pack',
    name: 'Premium Theme Pack',
    description:
      'Unlocks three additional share-card visual treatments: Clinical Gold, Courtroom, and Space Agency.',
    rationale:
      'Three new ways for the same emission to look like state evidence.',
    priceLabel: '$9 · pre-order',
    badge: 'BEST FOR SCREENSHOTS',
    available: false,
    ctaLabel: 'Notify me on launch',
  },
  {
    id: 'roast_mode_v1',
    type: 'roast_mode',
    name: 'Roast Mode · Targeted Dispatch',
    description:
      'A ceremonial counter-classification specifically authored against a named recipient. Sent as a sealed dispatch.',
    rationale:
      'Recognised nowhere, respected everywhere. Use sparingly.',
    priceLabel: '$3 · early access',
    badge: 'MOST TARGETED',
    available: false,
    ctaLabel: 'Join early access',
  },
];

export function getOfferById(id: string): PremiumOffer | undefined {
  return PREMIUM_OFFERS.find((o) => o.id === id);
}

/**
 * The visible-on-screen list, deduplicated and stable. Reserved for a
 * future filter (e.g. "show only available offers") so we can ship that
 * change without rewriting components.
 */
export function listOffers(): readonly PremiumOffer[] {
  return PREMIUM_OFFERS;
}

/**
 * Allowed values for the `?source=` param on the premium link, parsed and
 * validated so analytics receives a known enum value.
 */
export type PremiumSourceSurface = 'report' | 'share' | 'challenge' | 'direct';
const VALID_SOURCES: readonly PremiumSourceSurface[] = ['report', 'share', 'challenge', 'direct'];

export function parsePremiumSource(
  raw: string | null | undefined,
): PremiumSourceSurface {
  if (typeof raw !== 'string') return 'direct';
  const candidate = raw as PremiumSourceSurface;
  return VALID_SOURCES.includes(candidate) ? candidate : 'direct';
}

/**
 * Compose the `/premium` link from a variant id + the surface launching
 * the upsell. Used by both /report and /share entry points so analytics
 * attribution is consistent.
 */
export function premiumLinkFor(
  variantId: string,
  source: Extract<PremiumSourceSurface, 'report' | 'share' | 'challenge'>,
): string {
  const params = new URLSearchParams({ variant: variantId, source });
  return `/premium?${params.toString()}`;
}

/**
 * Build a deterministic, document-style filing number for a variant. Used
 * across both certificate previews so the same source variant always
 * produces the same serial — feels like a real records system rather than
 * a per-render random.
 */
export function fileNumberForVariant(variantId: string): string {
  // Take an FNV-1a-ish hash of the variant id, zero-pad to 5 digits.
  let h = 0x811c9dc5;
  for (let i = 0; i < variantId.length; i++) {
    h ^= variantId.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  const tail = (h % 90000) + 10000; // 10000..99999
  return `CERT-2026-${tail.toString()}-A`;
}
