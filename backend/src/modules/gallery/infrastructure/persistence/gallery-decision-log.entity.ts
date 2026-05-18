import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { GallerySubmissionEntity } from './gallery-submission.entity';

@Entity('gallery_decision_logs')
export class GalleryDecisionLogEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'submission_id', type: 'uuid' })
  submissionId!: string;

  @ManyToOne(() => GallerySubmissionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'submission_id' })
  submission?: GallerySubmissionEntity;

  @Column({ type: 'varchar', length: 48 })
  action!: string;

  @Column({ name: 'actor_kind', type: 'varchar', length: 16 })
  actorKind!: string;

  @Column({ name: 'actor_ref', type: 'varchar', length: 128, nullable: true })
  actorRef?: string;

  @Column({ name: 'from_status', type: 'varchar', length: 32, nullable: true })
  fromStatus?: string;

  @Column({ name: 'to_status', type: 'varchar', length: 32, nullable: true })
  toStatus?: string;

  @Column({ name: 'reason_code', type: 'varchar', length: 64, nullable: true })
  reasonCode?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
