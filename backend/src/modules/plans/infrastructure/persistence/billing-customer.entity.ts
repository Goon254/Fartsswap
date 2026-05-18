import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AnonymousSessionEntity } from '../../../identity/infrastructure/persistence/anonymous-session.entity';

@Entity('billing_customers')
export class BillingCustomerEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'holder_kind', type: 'varchar', length: 32 })
  holderKind!: string;

  @Column({ name: 'holder_id', type: 'uuid' })
  holderId!: string;

  @ManyToOne(() => AnonymousSessionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'holder_id' })
  holderSession?: AnonymousSessionEntity;

  @Column({ name: 'provider_code', type: 'varchar', length: 32, default: 'mock' })
  providerCode!: string;

  @Column({ name: 'external_ref', type: 'varchar', length: 160 })
  externalRef!: string;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
