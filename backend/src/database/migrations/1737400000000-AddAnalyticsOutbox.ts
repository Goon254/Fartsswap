import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAnalyticsOutbox1737400000000 implements MigrationInterface {
  name = 'AddAnalyticsOutbox1737400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE analytics_outbox (
        id UUID PRIMARY KEY,
        aggregate_type VARCHAR(64) NOT NULL,
        aggregate_id VARCHAR(64),
        event_type VARCHAR(64) NOT NULL,
        payload JSONB NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        dispatched_at TIMESTAMPTZ,
        last_error TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_analytics_outbox_pending
        ON analytics_outbox (dispatched_at, next_attempt_at)
        WHERE dispatched_at IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_analytics_outbox_pending`);
    await queryRunner.query(`DROP TABLE IF EXISTS analytics_outbox`);
  }
}
