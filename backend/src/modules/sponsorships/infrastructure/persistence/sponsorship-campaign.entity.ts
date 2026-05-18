import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { SponsorshipPlacementEntity } from './sponsorship-placement.entity';

@Entity('sponsorship_campaigns')
export class SponsorshipCampaignEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'internal_name', length: 160 })
  internalName!: string;

  @Column({ name: 'sponsor_public_label', length: 160 })
  sponsorPublicLabel!: string;

  @Column({ length: 32 })
  status!: string;

  @Column({ name: 'valid_from', type: 'timestamptz' })
  validFrom!: Date;

  @Column({ name: 'valid_until', type: 'timestamptz' })
  validUntil!: Date;

  @Column({ name: 'operator_notes', type: 'text', nullable: true })
  operatorNotes?: string;

  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt?: Date;

  @Column({ name: 'reviewed_by', length: 128, nullable: true })
  reviewedBy?: string;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => SponsorshipPlacementEntity, (p) => p.campaign)
  placements!: SponsorshipPlacementEntity[];
}
