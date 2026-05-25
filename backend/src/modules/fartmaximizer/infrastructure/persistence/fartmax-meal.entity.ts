import { Column, Entity, PrimaryColumn } from 'typeorm';

export type FartmaxMealStatus = 'active' | 'hidden';

@Entity('fartmax_meals')
export class FartmaxMealEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'seed_key', type: 'varchar', length: 16, nullable: true })
  seedKey?: string | null;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'varchar', length: 160, default: '' })
  description!: string;

  @Column({ name: 'vote_score', type: 'int', default: 0 })
  voteScore!: number;

  @Column({ name: 'upvote_count', type: 'int', default: 0 })
  upvoteCount!: number;

  @Column({ name: 'downvote_count', type: 'int', default: 0 })
  downvoteCount!: number;

  @Column({ name: 'submitter_session_id', type: 'uuid', nullable: true })
  submitterSessionId?: string | null;

  @Column({ type: 'varchar', length: 16, default: 'active' })
  status!: FartmaxMealStatus;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
