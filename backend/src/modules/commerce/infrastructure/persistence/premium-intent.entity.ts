import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('premium_intents')
export class PremiumIntentEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'session_id', type: 'uuid', nullable: true })
  sessionId?: string;

  @Column({ name: 'report_id', type: 'uuid', nullable: true })
  reportId?: string;

  @Column({ length: 64 })
  kind!: string;

  @Column({ type: 'jsonb', nullable: true })
  payload?: Record<string, unknown>;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
