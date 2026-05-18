import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { AnonymousSessionEntity } from '../../../identity/infrastructure/persistence/anonymous-session.entity';
import { CreatorSubscriptionPlanEntity } from './creator-subscription-plan.entity';

@Entity('creator_subscriptions')
export class CreatorSubscriptionEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'plan_id', type: 'uuid' })
  planId!: string;

  @ManyToOne(() => CreatorSubscriptionPlanEntity)
  @JoinColumn({ name: 'plan_id' })
  plan?: CreatorSubscriptionPlanEntity;

  @Column({ name: 'holder_kind', type: 'varchar', length: 32 })
  holderKind!: string;

  @Column({ name: 'holder_id', type: 'uuid' })
  holderId!: string;

  @ManyToOne(() => AnonymousSessionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'holder_id' })
  holderSession?: AnonymousSessionEntity;

  @Column({ type: 'varchar', length: 24 })
  status!: string;

  @Column({ name: 'billing_provider', type: 'varchar', length: 32, default: 'mock' })
  billingProvider!: string;

  @Column({ name: 'billing_customer_ref', type: 'varchar', length: 160, nullable: true })
  billingCustomerRef?: string;

  @Column({ name: 'billing_subscription_ref', type: 'varchar', length: 160, nullable: true })
  billingSubscriptionRef?: string;

  @Column({ name: 'current_period_start', type: 'timestamptz' })
  currentPeriodStart!: Date;

  @Column({ name: 'current_period_end', type: 'timestamptz' })
  currentPeriodEnd!: Date;

  @Column({ name: 'cancel_at_period_end', type: 'boolean', default: false })
  cancelAtPeriodEnd!: boolean;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
