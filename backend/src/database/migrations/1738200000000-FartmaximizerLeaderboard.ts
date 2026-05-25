import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Deterministic seed ids for the initial 20 meal combinations (stable across environments). */
const SEED_IDS = [
  'f1000001-0001-4001-8001-000000000001',
  'f1000001-0001-4001-8001-000000000002',
  'f1000001-0001-4001-8001-000000000003',
  'f1000001-0001-4001-8001-000000000004',
  'f1000001-0001-4001-8001-000000000005',
  'f1000001-0001-4001-8001-000000000006',
  'f1000001-0001-4001-8001-000000000007',
  'f1000001-0001-4001-8001-000000000008',
  'f1000001-0001-4001-8001-000000000009',
  'f1000001-0001-4001-8001-000000000010',
  'f1000001-0001-4001-8001-000000000011',
  'f1000001-0001-4001-8001-000000000012',
  'f1000001-0001-4001-8001-000000000013',
  'f1000001-0001-4001-8001-000000000014',
  'f1000001-0001-4001-8001-000000000015',
  'f1000001-0001-4001-8001-000000000016',
  'f1000001-0001-4001-8001-000000000017',
  'f1000001-0001-4001-8001-000000000018',
  'f1000001-0001-4001-8001-000000000019',
  'f1000001-0001-4001-8001-000000000020',
] as const;

const SEED_ROWS: { key: string; name: string; description: string; score: number }[] = [
  {
    key: 'm01',
    name: 'Airport Chili + Seat Warmer + Hubris',
    description: 'Filed after a gate change and zero accountability.',
    score: 2847,
  },
  {
    key: 'm02',
    name: 'Inherited Casserole + Family Group Chat',
    description: 'Emotional damage compounds the fiber load.',
    score: 2712,
  },
  {
    key: 'm03',
    name: 'Competitive Cheese Flight + Farmer’s Market Ego',
    description: 'Sampled eleven wedges “for research.”',
    score: 2598,
  },
  {
    key: 'm04',
    name: 'Burrito Before Yoga + False Confidence',
    description: 'The instructor asked you to leave with dignity.',
    score: 2411,
  },
  {
    key: 'm05',
    name: 'True-Crime Binge + Unnamed Crunchy Snacks',
    description: 'Episode seven unlocked something primal.',
    score: 2289,
  },
  {
    key: 'm06',
    name: 'Reply-All Lunch + Passive-Aggressive Salad',
    description: 'HR has been notified via methane.',
    score: 2156,
  },
  {
    key: 'm07',
    name: 'Thrift-Store Windbreaker + Gas Station Tuna Melt',
    description: 'Confidence was synthetic; consequences were not.',
    score: 2033,
  },
  {
    key: 'm08',
    name: 'Double Espresso + Forgot You Already Had Coffee',
    description: 'The nervous system filed a countersuit.',
    score: 1988,
  },
  {
    key: 'm09',
    name: 'Karaoke Wings + Song You Do Not Know',
    description: 'Vibrato triggered downstream turbulence.',
    score: 1874,
  },
  {
    key: 'm10',
    name: 'Museum Gift Shop Samples + No Meal Plan',
    description: 'Culture was consumed; dignity was not.',
    score: 1762,
  },
  {
    key: 'm11',
    name: 'Thermostat War Chili + Roommate Who Loves Winter',
    description: 'Domestic climate policy met digestive policy.',
    score: 1640,
  },
  {
    key: 'm12',
    name: 'Escape Room Burrito + Claustrophobic Timer',
    description: 'The team solved nothing except ventilation.',
    score: 1522,
  },
  {
    key: 'm13',
    name: 'Influencer Smoothie + Misspelled Superfoods',
    description: 'Spirulina was spelled wrong on purpose.',
    score: 1418,
  },
  {
    key: 'm14',
    name: 'Parallel Parking Audience + Nervous Takeout',
    description: 'Three strangers witnessed the entire arc.',
    score: 1305,
  },
  {
    key: 'm15',
    name: 'Wikipedia Submarines at 1am + Salted Crackers',
    description: 'Depth of research exceeded depth of judgment.',
    score: 1199,
  },
  {
    key: 'm16',
    name: 'Garage Sale Lava Lamp + Discount Hot Dogs',
    description: 'Negotiation skills did not transfer to digestion.',
    score: 1088,
  },
  {
    key: 'm17',
    name: 'Podcast at 2x Speed + Meal Prep Revenge',
    description: 'Productivity poisoned the break room.',
    score: 977,
  },
  {
    key: 'm18',
    name: 'Dog Walked You + Questionable Street Taco',
    description: 'The leash was not the only thing pulled.',
    score: 864,
  },
  {
    key: 'm19',
    name: 'Pre-Interview Power Pose + Garlic Knots',
    description: 'Confidence peaked before the elevator did.',
    score: 752,
  },
  {
    key: 'm20',
    name: 'Rain Delay Nachos + Sport You Did Not Watch',
    description: 'Atmospheric pressure changed indoors.',
    score: 641,
  },
];

export class FartmaximizerLeaderboard1738200000000 implements MigrationInterface {
  name = 'FartmaximizerLeaderboard1738200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE fartmax_meals (
        id UUID PRIMARY KEY,
        seed_key VARCHAR(16),
        name VARCHAR(120) NOT NULL,
        description VARCHAR(160) NOT NULL DEFAULT '',
        vote_score INT NOT NULL DEFAULT 0,
        upvote_count INT NOT NULL DEFAULT 0,
        downvote_count INT NOT NULL DEFAULT 0,
        submitter_session_id UUID REFERENCES anonymous_sessions(id) ON DELETE SET NULL,
        status VARCHAR(16) NOT NULL DEFAULT 'active'
          CHECK (status IN ('active', 'hidden')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_fartmax_meals_seed_key UNIQUE (seed_key)
      );
      CREATE INDEX idx_fartmax_meals_leaderboard
        ON fartmax_meals (status, vote_score DESC, created_at ASC);
    `);

    await queryRunner.query(`
      CREATE TABLE fartmax_votes (
        id UUID PRIMARY KEY,
        meal_id UUID NOT NULL REFERENCES fartmax_meals(id) ON DELETE CASCADE,
        voter_session_id UUID NOT NULL REFERENCES anonymous_sessions(id) ON DELETE CASCADE,
        direction SMALLINT NOT NULL CHECK (direction IN (1, -1)),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_fartmax_vote_once UNIQUE (meal_id, voter_session_id)
      );
      CREATE INDEX idx_fartmax_votes_session ON fartmax_votes (voter_session_id);
    `);

    const now = new Date().toISOString();
    for (let i = 0; i < SEED_ROWS.length; i++) {
      const row = SEED_ROWS[i]!;
      const id = SEED_IDS[i]!;
      const name = row.name.replace(/'/g, "''");
      const description = row.description.replace(/'/g, "''");
      await queryRunner.query(`
        INSERT INTO fartmax_meals (
          id, seed_key, name, description, vote_score, upvote_count, downvote_count,
          status, created_at, updated_at
        ) VALUES (
          '${id}', '${row.key}', '${name}', '${description}',
          ${row.score}, ${row.score}, 0, 'active', '${now}', '${now}'
        );
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS fartmax_votes`);
    await queryRunner.query(`DROP TABLE IF EXISTS fartmax_meals`);
  }
}
