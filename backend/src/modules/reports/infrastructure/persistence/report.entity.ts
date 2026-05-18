import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('reports')
export class ReportEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'session_id', type: 'uuid', nullable: true })
  sessionId?: string;

  @Column({ name: 'public_slug', length: 32, nullable: true, unique: true })
  publicSlug?: string;

  @Column({ name: 'variant_id', length: 128, nullable: true })
  variantId?: string;

  @Column({ name: 'platform_metadata', type: 'jsonb', nullable: true })
  platformMetadata?: Record<string, unknown>;

  @Column({ length: 32 })
  status!: string;

  @Column({ length: 32 })
  source!: string;

  @Column({ name: 'fart_name', length: 255 })
  fartName!: string;

  @Column({ length: 128 })
  classification!: string;

  @Column({ name: 'power_score', type: 'smallint' })
  powerScore!: number;

  @Column({ name: 'duration_ms', type: 'int', default: 0 })
  durationMs!: number;

  @Column({ name: 'emotional_tone', length: 255 })
  emotionalTone!: string;

  @Column({ name: 'probable_cause', length: 512 })
  probableCause!: string;

  @Column({ name: 'cinematic_parallel', length: 512 })
  cinematicParallel!: string;

  @Column({ name: 'threat_level', length: 64 })
  threatLevel!: string;

  @Column({ name: 'fart_hash', length: 128 })
  fartHash!: string;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt?: Date;
}
