import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { PodFulfillmentOrderEntity } from './pod-fulfillment-order.entity';

@Entity('pod_fulfillment_order_items')
export class PodFulfillmentOrderItemEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId!: string;

  @ManyToOne(() => PodFulfillmentOrderEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order?: PodFulfillmentOrderEntity;

  @Column({ name: 'pod_product_type', type: 'varchar', length: 48 })
  podProductType!: string;

  @Column({ name: 'commerce_sku', type: 'varchar', length: 96 })
  commerceSku!: string;

  @Column({ type: 'int', default: 1 })
  quantity!: number;

  @Column({ type: 'jsonb', default: () => `'{}'` })
  personalization!: Record<string, unknown>;

  @Column({ name: 'provider_line_ref', type: 'varchar', length: 160, nullable: true })
  providerLineRef?: string;

  @Column({ name: 'line_status', type: 'varchar', length: 32, default: 'pending' })
  lineStatus!: string;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
