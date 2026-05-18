import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CreatorSubscriptionPlanEntity } from './creator-subscription-plan.entity';

@Entity('creator_subscription_plan_features')
export class CreatorSubscriptionPlanFeatureEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'plan_id', type: 'uuid' })
  planId!: string;

  @ManyToOne(() => CreatorSubscriptionPlanEntity, (p) => p.features, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plan_id' })
  plan?: CreatorSubscriptionPlanEntity;

  @Column({ name: 'feature_key', type: 'varchar', length: 64 })
  featureKey!: string;

  @Column({ name: 'limit_per_period', type: 'int', nullable: true })
  limitPerPeriod?: number;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
