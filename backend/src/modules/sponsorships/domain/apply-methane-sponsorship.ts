import type { MethaneIndexIssueDto } from '../../rituals/interface/http/dto/methane-index.dto';
import type { SponsorshipPlacementSurfaceDto } from './sponsorship-slots';

/**
 * Merges ceremonial sponsorship overlays into a Methane Index issue.
 * Does not alter scores, ranks, or Bureau truth fields.
 */
export function applySponsorshipToMethaneIssue(
  issue: MethaneIndexIssueDto,
  placements: readonly SponsorshipPlacementSurfaceDto[],
): MethaneIndexIssueDto {
  let next: MethaneIndexIssueDto = issue;
  for (const p of placements) {
    if (p.slotCode === 'sponsored_classification') {
      const v = p.creative.targetVariantId as string | undefined;
      const foot = p.creative.ceremonialFootnote as string | undefined;
      if (typeof v === 'string' && typeof foot === 'string') {
        next = {
          ...next,
          classifications: next.classifications.map((row) =>
            row.variantId === v
              ? { ...row, sponsorFootnote: foot, sponsorPlacementId: p.placementId }
              : row,
          ),
        };
      }
    }
    if (p.slotCode === 'sponsored_probable_cause') {
      const line = p.creative.ceremonialLine as string | undefined;
      if (typeof line === 'string') {
        next = {
          ...next,
          featured: {
            ...next.featured,
            sponsorProbableCauseLine: line,
            sponsorProbableCausePlacementId: p.placementId,
          },
        };
      }
    }
  }
  return next;
}
