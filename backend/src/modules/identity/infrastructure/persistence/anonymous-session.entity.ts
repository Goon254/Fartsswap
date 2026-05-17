import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('anonymous_sessions')
export class AnonymousSessionEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'last_seen_at', type: 'timestamptz' })
  lastSeenAt!: Date;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;
}
