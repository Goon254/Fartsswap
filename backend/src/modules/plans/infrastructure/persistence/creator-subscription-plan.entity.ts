import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { CreatorSubscriptionPlanFeatureEntity } from './creator-subscription-plan-feature.entity';

@Entity('creator_subscription_plans')
export class CreatorSubscriptionPlanEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  code!: string;

  @Column({ name: 'display_name', type: 'varchar', length: 160 })
  displayName!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 32 })
  audience!: string;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number;

  @Column({ type: 'jsonb', default: () => `'{}'` })
  metadata!: Record<string, unknown>;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @OneToMany(() => CreatorSubscriptionPlanFeatureEntity, (f) => f.plan)
  features?: CreatorSubscriptionPlanFeatureEntity[];
}
