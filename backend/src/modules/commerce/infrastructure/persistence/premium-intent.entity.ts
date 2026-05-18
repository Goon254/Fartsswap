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

  @Column({ name: 'lifecycle_state', length: 48, default: 'intent_created' })
  lifecycleState!: string;

  @Column({ name: 'commerce_theme_code', length: 64, nullable: true })
  commerceThemeCode?: string;

  @Column({ name: 'product_sku', length: 64, nullable: true })
  productSku?: string;

  @Column({ name: 'amount_cents', type: 'int', nullable: true })
  amountCents?: number;

  @Column({ name: 'currency', length: 3, default: 'USD' })
  currency!: string;

  @Column({ name: 'checkout_external_id', length: 128, nullable: true })
  checkoutExternalId?: string;

  @Column({ name: 'fulfillment_ref', length: 128, nullable: true })
  fulfillmentRef?: string;

  @Column({ name: 'fulfilled_at', type: 'timestamptz', nullable: true })
  fulfilledAt?: Date;

  @Column({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
