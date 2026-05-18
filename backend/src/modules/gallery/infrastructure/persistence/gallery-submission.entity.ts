import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { ReportEntity } from '../../../reports/infrastructure/persistence/report.entity';
import { ReportArtifactEntity } from '../../../artifacts/infrastructure/persistence/report-artifact.entity';
import { AnonymousSessionEntity } from '../../../identity/infrastructure/persistence/anonymous-session.entity';

@Entity('gallery_submissions')
export class GallerySubmissionEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'report_id', type: 'uuid' })
  reportId!: string;

  @ManyToOne(() => ReportEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'report_id' })
  report?: ReportEntity;

  @Column({ name: 'report_artifact_id', type: 'uuid', nullable: true })
  reportArtifactId?: string;

  @ManyToOne(() => ReportArtifactEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'report_artifact_id' })
  reportArtifact?: ReportArtifactEntity;

  @Column({ name: 'submitter_session_id', type: 'uuid' })
  submitterSessionId!: string;

  @ManyToOne(() => AnonymousSessionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'submitter_session_id' })
  submitterSession?: AnonymousSessionEntity;

  @Column({ type: 'varchar', length: 32 })
  status!: string;

  @Column({ type: 'boolean', default: true })
  listed!: boolean;

  @Column({ name: 'featured_rank', type: 'int', nullable: true })
  featuredRank?: number;

  @Column({ name: 'automated_screening', type: 'jsonb', default: () => `'{}'` })
  automatedScreening!: Record<string, unknown>;

  @Column({ name: 'operator_notes', type: 'text', nullable: true })
  operatorNotes?: string;

  @Column({ name: 'last_reason_code', type: 'varchar', length: 64, nullable: true })
  lastReasonCode?: string;

  @Column({ name: 'submitted_at', type: 'timestamptz' })
  submittedAt!: Date;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt?: Date;

  @Column({ name: 'removed_at', type: 'timestamptz', nullable: true })
  removedAt?: Date;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
