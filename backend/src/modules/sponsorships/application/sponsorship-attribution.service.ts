import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CLOCK_PORT, type ClockPort } from '../../../shared/application/ports/clock.port';
import { ID_GENERATOR_PORT, type IdGeneratorPort } from '../../../shared/application/ports/id-generator.port';
import { AnalyticsEventType } from '../../../shared/domain/types';
import { TrackAnalyticsEventUseCase } from '../../analytics/application/track-analytics-event.use-case';
import { SponsorshipAttributionEntity } from '../infrastructure/persistence/sponsorship-attribution.entity';
import { SponsorshipPlacementEntity } from '../infrastructure/persistence/sponsorship-placement.entity';

export interface RecordSponsorshipAttributionCommand {
  placementId: string;
  eventType: 'served' | 'click' | 'preview';
  sessionId?: string;
  reportId?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class SponsorshipAttributionService {
  constructor(
    @InjectRepository(SponsorshipPlacementEntity) private readonly placements: Repository<SponsorshipPlacementEntity>,
    @InjectRepository(SponsorshipAttributionEntity) private readonly attributions: Repository<SponsorshipAttributionEntity>,
    @Inject(ID_GENERATOR_PORT) private readonly ids: IdGeneratorPort,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
    private readonly trackEvent: TrackAnalyticsEventUseCase,
  ) {}

  async record(cmd: RecordSponsorshipAttributionCommand): Promise<void> {
    const placement = await this.placements.findOne({
      where: { id: cmd.placementId },
      relations: { campaign: true },
    });
    if (!placement) {
      throw new BadRequestException('Unknown placement');
    }
    const now = this.clock.now();
    const row = new SponsorshipAttributionEntity();
    row.id = this.ids.generate();
    row.campaignId = placement.campaignId;
    row.placementId = placement.id;
    row.slotCode = placement.slotCode;
    row.eventType = cmd.eventType;
    row.sessionId = cmd.sessionId;
    row.reportId = cmd.reportId;
    row.metadata = cmd.metadata;
    row.createdAt = now;
    await this.attributions.save(row);

    const mapEvent = (): string => {
      if (cmd.eventType === 'click') return AnalyticsEventType.SPONSORED_INVENTORY_CLICKED;
      if (cmd.eventType === 'preview') return AnalyticsEventType.CAMPAIGN_PREVIEW_RENDERED;
      return AnalyticsEventType.SPONSORED_INVENTORY_SERVED;
    };
    void this.trackEvent.trackBestEffort({
      ...(cmd.sessionId !== undefined ? { sessionId: cmd.sessionId } : {}),
      ...(cmd.reportId !== undefined ? { reportId: cmd.reportId } : {}),
      eventType: mapEvent(),
      payload: {
        placementId: placement.id,
        campaignId: placement.campaignId,
        slotCode: placement.slotCode,
        clientEvent: cmd.eventType,
      },
    });
  }
}
