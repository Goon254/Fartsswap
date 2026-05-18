import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { SponsorshipCampaignEntity } from './sponsorship-campaign.entity';
import { SponsorshipPlacementEntity } from './sponsorship-placement.entity';

@Entity('sponsorship_attributions')
export class SponsorshipAttributionEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'campaign_id', type: 'uuid' })
  campaignId!: string;

  @ManyToOne(() => SponsorshipCampaignEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_id' })
  campaign!: SponsorshipCampaignEntity;

  @Column({ name: 'placement_id', type: 'uuid', nullable: true })
  placementId?: string;

  @ManyToOne(() => SponsorshipPlacementEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'placement_id' })
  placement?: SponsorshipPlacementEntity;

  @Column({ name: 'slot_code', length: 64 })
  slotCode!: string;

  @Column({ name: 'event_type', length: 32 })
  eventType!: string;

  @Column({ name: 'session_id', type: 'uuid', nullable: true })
  sessionId?: string;

  @Column({ name: 'report_id', type: 'uuid', nullable: true })
  reportId?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
