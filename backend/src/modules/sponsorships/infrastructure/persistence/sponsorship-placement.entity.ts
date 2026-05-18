import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { SponsorshipCampaignEntity } from './sponsorship-campaign.entity';

@Entity('sponsorship_placements')
export class SponsorshipPlacementEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'campaign_id', type: 'uuid' })
  campaignId!: string;

  @ManyToOne(() => SponsorshipCampaignEntity, (c) => c.placements, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'campaign_id' })
  campaign!: SponsorshipCampaignEntity;

  @Column({ name: 'slot_code', length: 64 })
  slotCode!: string;

  @Column({ name: 'ceremonial_field', length: 96 })
  ceremonialField!: string;

  @Column({ name: 'creative_payload', type: 'jsonb' })
  creativePayload!: Record<string, unknown>;

  @Column({ name: 'display_priority', type: 'int', default: 0 })
  displayPriority!: number;

  @Column({ name: 'preview_ok', type: 'boolean', default: false })
  previewOk!: boolean;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
