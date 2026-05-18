import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CreatorSubscriptionEntity } from './creator-subscription.entity';

@Entity('billing_lifecycle_events')
export class BillingLifecycleEventEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'subscription_id', type: 'uuid', nullable: true })
  subscriptionId?: string;

  @ManyToOne(() => CreatorSubscriptionEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'subscription_id' })
  subscription?: CreatorSubscriptionEntity;

  @Column({ name: 'holder_kind', type: 'varchar', length: 32, nullable: true })
  holderKind?: string;

  @Column({ name: 'holder_id', type: 'uuid', nullable: true })
  holderId?: string;

  @Column({ name: 'event_type', type: 'varchar', length: 48 })
  eventType!: string;

  @Column({ type: 'jsonb', nullable: true })
  payload?: Record<string, unknown>;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
