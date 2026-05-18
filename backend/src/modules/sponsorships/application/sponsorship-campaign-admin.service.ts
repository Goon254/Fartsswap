import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CLOCK_PORT, type ClockPort } from '../../../shared/application/ports/clock.port';
import { ID_GENERATOR_PORT, type IdGeneratorPort } from '../../../shared/application/ports/id-generator.port';
import { AnalyticsEventType } from '../../../shared/domain/types';
import { TrackAnalyticsEventUseCase } from '../../analytics/application/track-analytics-event.use-case';
import { validateSponsorshipCreative } from '../domain/sponsorship-creative.validator';
import type { SponsorshipCampaignStatus } from '../domain/sponsorship-slots';
import { SponsorshipCampaignEntity } from '../infrastructure/persistence/sponsorship-campaign.entity';
import { SponsorshipPlacementEntity } from '../infrastructure/persistence/sponsorship-placement.entity';

const CAMPAIGN_STATUSES: readonly SponsorshipCampaignStatus[] = [
  'draft',
  'pending_review',
  'approved',
  'active',
  'paused',
  'archived',
];

export interface CreateSponsorshipCampaignBody {
  internalName: string;
  sponsorPublicLabel: string;
  validFromIso: string;
  validUntilIso: string;
  status?: SponsorshipCampaignStatus;
  operatorNotes?: string;
}

export interface AddPlacementBody {
  slotCode: string;
  ceremonialField: string;
  creativePayload: unknown;
  displayPriority?: number;
  previewOk?: boolean;
}

@Injectable()
export class SponsorshipCampaignAdminService {
  constructor(
    @InjectRepository(SponsorshipCampaignEntity) private readonly campaigns: Repository<SponsorshipCampaignEntity>,
    @InjectRepository(SponsorshipPlacementEntity) private readonly placements: Repository<SponsorshipPlacementEntity>,
    @Inject(ID_GENERATOR_PORT) private readonly ids: IdGeneratorPort,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
    private readonly trackEvent: TrackAnalyticsEventUseCase,
  ) {}

  async listCampaigns(): Promise<SponsorshipCampaignEntity[]> {
    return this.campaigns.find({ order: { updatedAt: 'DESC' } });
  }

  async createCampaign(body: CreateSponsorshipCampaignBody): Promise<SponsorshipCampaignEntity> {
    const now = this.clock.now();
    const validFrom = new Date(body.validFromIso);
    const validUntil = new Date(body.validUntilIso);
    if (Number.isNaN(validFrom.getTime()) || Number.isNaN(validUntil.getTime())) {
      throw new BadRequestException('Invalid schedule window');
    }
    if (validUntil <= validFrom) {
      throw new BadRequestException('validUntil must be after validFrom');
    }
    const c = new SponsorshipCampaignEntity();
    c.id = this.ids.generate();
    c.internalName = body.internalName.trim().slice(0, 160);
    c.sponsorPublicLabel = body.sponsorPublicLabel.trim().slice(0, 160);
    c.status = body.status ?? 'draft';
    c.validFrom = validFrom;
    c.validUntil = validUntil;
    c.operatorNotes = body.operatorNotes;
    c.createdAt = now;
    c.updatedAt = now;
    return this.campaigns.save(c);
  }

  async addPlacement(campaignId: string, body: AddPlacementBody): Promise<SponsorshipPlacementEntity> {
    const campaign = await this.campaigns.findOne({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    const creative = validateSponsorshipCreative(body.slotCode, body.creativePayload);
    const now = this.clock.now();
    const p = new SponsorshipPlacementEntity();
    p.id = this.ids.generate();
    p.campaignId = campaignId;
    p.slotCode = body.slotCode;
    p.ceremonialField = body.ceremonialField.trim().slice(0, 96);
    p.creativePayload = creative;
    p.displayPriority = body.displayPriority ?? 0;
    p.previewOk = body.previewOk ?? false;
    p.createdAt = now;
    p.updatedAt = now;
    return this.placements.save(p);
  }

  async setCampaignStatus(campaignId: string, status: SponsorshipCampaignStatus): Promise<SponsorshipCampaignEntity> {
    if (!CAMPAIGN_STATUSES.includes(status)) {
      throw new BadRequestException(`Invalid status ${status}`);
    }
    const c = await this.campaigns.findOne({ where: { id: campaignId } });
    if (!c) throw new NotFoundException('Campaign not found');
    if (status === 'active') {
      const list = await this.placements.find({ where: { campaignId } });
      if (list.length === 0) {
        throw new BadRequestException('Cannot activate campaign without placements');
      }
      for (const p of list) {
        validateSponsorshipCreative(p.slotCode, p.creativePayload);
      }
    }
    c.status = status;
    c.updatedAt = this.clock.now();
    return this.campaigns.save(c);
  }

  async seedDemoCampaign(): Promise<{ campaignId: string }> {
    const now = this.clock.now();
    const start = new Date(now.getTime() - 60_000);
    const end = new Date(now.getTime() + 86400_000 * 365);
    const c = await this.createCampaign({
      internalName: 'Demo · Bureau Stationery Partner',
      sponsorPublicLabel: 'Bureau Stationery Co.',
      validFromIso: start.toISOString(),
      validUntilIso: end.toISOString(),
      status: 'active',
      operatorNotes: 'Seeded demo — replace in production',
    });
    await this.addPlacement(c.id, {
      slotCode: 'methane_index_powered_by',
      ceremonialField: 'index_masthead_powered_by',
      creativePayload: {
        line: 'National Methane Index — archival indices courtesy of Bureau Stationery Co.',
        disclosure: 'Sponsored placement · Bureau editorial independence retained.',
        destinationUrl: 'https://example.com',
      },
      displayPriority: 10,
      previewOk: true,
    });
    await this.addPlacement(c.id, {
      slotCode: 'sponsored_challenge',
      ceremonialField: 'challenge_surface_eyebrow',
      creativePayload: {
        supportingLine: 'Challenge issuance supported by Bureau Stationery Co.',
      },
      displayPriority: 5,
      previewOk: true,
    });
    void this.trackEvent.trackBestEffort({
      eventType: AnalyticsEventType.CAMPAIGN_PREVIEW_RENDERED,
      payload: { campaignId: c.id, mode: 'seed_demo' },
    });
    return { campaignId: c.id };
  }
}
