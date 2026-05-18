import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { PremiumIntentEntity } from '../../../commerce/infrastructure/persistence/premium-intent.entity';
import { AnonymousSessionEntity } from '../../../identity/infrastructure/persistence/anonymous-session.entity';
import { ReportEntity } from '../../../reports/infrastructure/persistence/report.entity';

@Entity('pod_fulfillment_orders')
export class PodFulfillmentOrderEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'premium_intent_id', type: 'uuid' })
  premiumIntentId!: string;

  @ManyToOne(() => PremiumIntentEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'premium_intent_id' })
  premiumIntent?: PremiumIntentEntity;

  @Column({ name: 'session_id', type: 'uuid', nullable: true })
  sessionId?: string;

  @ManyToOne(() => AnonymousSessionEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'session_id' })
  session?: AnonymousSessionEntity;

  @Column({ name: 'report_id', type: 'uuid', nullable: true })
  reportId?: string;

  @ManyToOne(() => ReportEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'report_id' })
  report?: ReportEntity;

  @Column({ type: 'varchar', length: 32 })
  status!: string;

  @Column({ name: 'provider_code', type: 'varchar', length: 32, default: 'mock' })
  providerCode!: string;

  @Column({ name: 'provider_order_ref', type: 'varchar', length: 160, nullable: true })
  providerOrderRef?: string;

  @Column({ name: 'packaged_assets', type: 'jsonb', default: () => `'{}'` })
  packagedAssets!: Record<string, unknown>;

  @Column({ name: 'shipping_summary', type: 'jsonb', nullable: true })
  shippingSummary?: Record<string, unknown>;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency!: string;

  @Column({ name: 'amount_cents', type: 'int', nullable: true })
  amountCents?: number;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
