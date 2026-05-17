import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('report_artifacts')
export class ReportArtifactEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'report_id', type: 'uuid' })
  reportId!: string;

  @Column({ length: 64 })
  type!: string;

  @Column({ length: 32, default: 'pending' })
  status!: string;

  @Column({ name: 'storage_key', length: 512, nullable: true })
  storageKey?: string;

  @Column({ name: 'mime_type', length: 128, nullable: true })
  mimeType?: string;

  @Column({ name: 'style_variant', length: 64, nullable: true })
  styleVariant?: string;

  @Column({ name: 'failure_reason', type: 'text', nullable: true })
  failureReason?: string;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @Column({ name: 'failed_at', type: 'timestamptz', nullable: true })
  failedAt?: Date;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
