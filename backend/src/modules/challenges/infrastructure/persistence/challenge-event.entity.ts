import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('challenge_events')
export class ChallengeEventEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'challenge_link_id', length: 64 })
  challengeLinkId!: string;

  @Column({ name: 'session_id', type: 'uuid', nullable: true })
  sessionId?: string;

  @Column({ length: 64 })
  kind!: string;

  @Column({ type: 'jsonb', nullable: true })
  payload?: Record<string, unknown>;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
