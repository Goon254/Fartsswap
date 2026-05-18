import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { PodFulfillmentOrderEntity } from './pod-fulfillment-order.entity';

@Entity('pod_fulfillment_events')
export class PodFulfillmentEventEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId!: string;

  @ManyToOne(() => PodFulfillmentOrderEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order?: PodFulfillmentOrderEntity;

  @Column({ name: 'previous_status', type: 'varchar', length: 32, nullable: true })
  previousStatus?: string;

  @Column({ name: 'new_status', type: 'varchar', length: 32 })
  newStatus!: string;

  @Column({ type: 'varchar', length: 160, nullable: true })
  reason?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
