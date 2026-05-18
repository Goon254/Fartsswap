import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { GallerySubmissionEntity } from './gallery-submission.entity';
import { AnonymousSessionEntity } from '../../../identity/infrastructure/persistence/anonymous-session.entity';

@Entity('gallery_item_reports')
export class GalleryItemReportEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'submission_id', type: 'uuid' })
  submissionId!: string;

  @ManyToOne(() => GallerySubmissionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'submission_id' })
  submission?: GallerySubmissionEntity;

  @Column({ name: 'reporter_session_id', type: 'uuid' })
  reporterSessionId!: string;

  @ManyToOne(() => AnonymousSessionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reporter_session_id' })
  reporterSession?: AnonymousSessionEntity;

  @Column({ name: 'reason_code', type: 'varchar', length: 64 })
  reasonCode!: string;

  @Column({ type: 'text', nullable: true })
  details?: string;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt?: Date;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
