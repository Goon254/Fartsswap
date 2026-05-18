import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('challenge_links')
export class ChallengeLinkEntity {
  @PrimaryColumn({ length: 64 })
  id!: string;

  @Column({ name: 'session_id', type: 'uuid', nullable: true })
  sessionId?: string;

  @Column({ name: 'report_id', type: 'uuid', nullable: true })
  reportId?: string;

  @Column({ name: 'variant_id', length: 128 })
  variantId!: string;

  @Column({ name: 'source_score', type: 'smallint' })
  sourceScore!: number;

  @Column({ name: 'challenge_type', length: 32 })
  challengeType!: string;

  @Column({ name: 'source_surface', length: 16 })
  sourceSurface!: string;

  @Column({ name: 'issued_at', type: 'timestamptz' })
  issuedAt!: Date;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
