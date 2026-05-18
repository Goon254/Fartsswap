import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { AnonymousSessionEntity } from '../../../identity/infrastructure/persistence/anonymous-session.entity';

@Entity('gallery_session_blocks')
export class GallerySessionBlockEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'session_id', type: 'uuid' })
  sessionId!: string;

  @ManyToOne(() => AnonymousSessionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'session_id' })
  session?: AnonymousSessionEntity;

  @Column({ name: 'restriction_kind', type: 'varchar', length: 32 })
  restrictionKind!: string;

  @Column({ name: 'reason_code', type: 'varchar', length: 64 })
  reasonCode!: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'created_by', type: 'varchar', length: 128, nullable: true })
  createdBy?: string;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt?: Date;

  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt?: Date;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
