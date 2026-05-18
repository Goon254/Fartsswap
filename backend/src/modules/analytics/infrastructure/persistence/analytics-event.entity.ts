import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('analytics_events')
export class AnalyticsEventEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'session_id', type: 'uuid', nullable: true })
  sessionId?: string;

  @Column({ name: 'report_id', type: 'uuid', nullable: true })
  reportId?: string;

  @Column({ name: 'event_type', length: 128 })
  eventType!: string;

  @Column({ type: 'jsonb', nullable: true })
  payload?: Record<string, unknown>;

  @Column({ name: 'client_event_id', type: 'uuid', nullable: true })
  clientEventId?: string;

  @Column({ name: 'ingest_source', length: 16, default: 'server' })
  ingestSource!: string;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
