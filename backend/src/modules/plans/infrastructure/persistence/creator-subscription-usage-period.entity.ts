import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CreatorSubscriptionEntity } from './creator-subscription.entity';

@Entity('creator_subscription_usage_periods')
export class CreatorSubscriptionUsagePeriodEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'subscription_id', type: 'uuid' })
  subscriptionId!: string;

  @ManyToOne(() => CreatorSubscriptionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subscription_id' })
  subscription?: CreatorSubscriptionEntity;

  @Column({ name: 'feature_key', type: 'varchar', length: 64 })
  featureKey!: string;

  @Column({ name: 'period_key', type: 'varchar', length: 16 })
  periodKey!: string;

  @Column({ name: 'used_count', type: 'int', default: 0 })
  usedCount!: number;

  @Column({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
