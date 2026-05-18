import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AnalyticsEventType } from '../../../shared/domain/types';
import { TrackAnalyticsEventUseCase } from '../../analytics/application/track-analytics-event.use-case';
import { validateSponsorshipCreative } from '../domain/sponsorship-creative.validator';
import type { SponsorshipPlacementSurfaceDto, SponsorshipSlotCode } from '../domain/sponsorship-slots';

interface PlacementRow {
  placement_id: string;
  slot_code: string;
  creative_payload: unknown;
  campaign_id: string;
  sponsor_public_label: string;
}

@Injectable()
export class SponsorshipResolveService {
  private readonly logger = new Logger(SponsorshipResolveService.name);

  constructor(
    @InjectDataSource() private readonly db: DataSource,
    private readonly trackEvent: TrackAnalyticsEventUseCase,
  ) {}

  /**
   * One winning placement per slot: highest display_priority, then newest campaign window start.
   */
  async resolveActiveSlots(
    slots: readonly SponsorshipSlotCode[],
    options?: { sessionId?: string; trackServed?: boolean },
  ): Promise<readonly SponsorshipPlacementSurfaceDto[]> {
    if (slots.length === 0) return [];
    const rows = (await this.db.query(
      `SELECT DISTINCT ON (p.slot_code)
         p.id AS placement_id,
         p.slot_code,
         p.creative_payload,
         p.campaign_id,
         c.sponsor_public_label
       FROM sponsorship_placements p
       INNER JOIN sponsorship_campaigns c ON c.id = p.campaign_id
       WHERE p.slot_code = ANY($1::text[])
         AND c.status = 'active'
         AND c.valid_from <= NOW()
         AND c.valid_until > NOW()
       ORDER BY p.slot_code, p.display_priority DESC, c.valid_from DESC`,
      [slots],
    )) as PlacementRow[];

    const out: SponsorshipPlacementSurfaceDto[] = [];
    for (const r of rows) {
      try {
        const creative = validateSponsorshipCreative(r.slot_code, r.creative_payload);
        out.push({
          slotCode: r.slot_code as SponsorshipSlotCode,
          campaignId: r.campaign_id,
          placementId: r.placement_id,
          sponsorPublicLabel: r.sponsor_public_label,
          creative,
        });
      } catch (e) {
        this.logger.warn({ err: e, placementId: r.placement_id, slot: r.slot_code }, 'skipping unsafe placement');
      }
    }

    if (options?.trackServed && out.length > 0) {
      void this.trackEvent.trackBestEffort({
        ...(options.sessionId !== undefined ? { sessionId: options.sessionId } : {}),
        eventType: AnalyticsEventType.SPONSORED_INVENTORY_SERVED,
        payload: {
          slots: out.map((p) => ({ slotCode: p.slotCode, placementId: p.placementId, campaignId: p.campaignId })),
        },
      });
    }

    return out;
  }
}
