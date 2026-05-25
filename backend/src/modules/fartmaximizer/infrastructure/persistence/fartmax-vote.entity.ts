import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('fartmax_votes')
export class FartmaxVoteEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ name: 'meal_id', type: 'uuid' })
  mealId!: string;

  @Column({ name: 'voter_session_id', type: 'uuid' })
  voterSessionId!: string;

  /** 1 = up, -1 = down */
  @Column({ type: 'smallint' })
  direction!: 1 | -1;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @Column({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
