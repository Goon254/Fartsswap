import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CoreLoopPersistence1737600000000 implements MigrationInterface {
  name = 'CoreLoopPersistence1737600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE analytics_events
        ADD COLUMN IF NOT EXISTS client_event_id UUID NULL,
        ADD COLUMN IF NOT EXISTS ingest_source VARCHAR(16) NOT NULL DEFAULT 'server';
    `);
    await queryRunner.query(`
      ALTER TABLE analytics_events
        ADD CONSTRAINT uq_analytics_events_client_event_id UNIQUE (client_event_id);
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_analytics_events_ingest_source
        ON analytics_events (ingest_source, created_at DESC);
    `);

    await queryRunner.query(`
      ALTER TABLE reports
        ADD COLUMN IF NOT EXISTS public_slug VARCHAR(32) NULL,
        ADD COLUMN IF NOT EXISTS variant_id VARCHAR(128) NULL,
        ADD COLUMN IF NOT EXISTS platform_metadata JSONB NULL;
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_public_slug ON reports (public_slug)
        WHERE public_slug IS NOT NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE share_links
        ADD COLUMN IF NOT EXISTS session_id UUID NULL REFERENCES anonymous_sessions(id) ON DELETE SET NULL;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_share_links_session_id ON share_links (session_id);
    `);

    await queryRunner.query(`
      CREATE TABLE share_events (
        id UUID PRIMARY KEY,
        session_id UUID REFERENCES anonymous_sessions(id) ON DELETE SET NULL,
        report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
        share_link_id UUID REFERENCES share_links(id) ON DELETE SET NULL,
        kind VARCHAR(64) NOT NULL,
        payload JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_share_events_session_id ON share_events (session_id);
      CREATE INDEX idx_share_events_report_id ON share_events (report_id);
      CREATE INDEX idx_share_events_share_link_id ON share_events (share_link_id);
      CREATE INDEX idx_share_events_created_at ON share_events (created_at DESC);
    `);

    await queryRunner.query(`
      CREATE TABLE challenge_links (
        id VARCHAR(64) PRIMARY KEY,
        session_id UUID REFERENCES anonymous_sessions(id) ON DELETE SET NULL,
        report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
        variant_id VARCHAR(128) NOT NULL,
        source_score SMALLINT NOT NULL CHECK (source_score >= 0 AND source_score <= 100),
        challenge_type VARCHAR(32) NOT NULL,
        source_surface VARCHAR(16) NOT NULL,
        issued_at TIMESTAMPTZ NOT NULL,
        resolved_at TIMESTAMPTZ,
        metadata JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_challenge_links_session_id ON challenge_links (session_id);
      CREATE INDEX idx_challenge_links_report_id ON challenge_links (report_id);
      CREATE INDEX idx_challenge_links_created_at ON challenge_links (created_at DESC);
    `);

    await queryRunner.query(`
      CREATE TABLE challenge_events (
        id UUID PRIMARY KEY,
        challenge_link_id VARCHAR(64) NOT NULL REFERENCES challenge_links(id) ON DELETE CASCADE,
        session_id UUID REFERENCES anonymous_sessions(id) ON DELETE SET NULL,
        kind VARCHAR(64) NOT NULL,
        payload JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_challenge_events_challenge_link_id ON challenge_events (challenge_link_id);
      CREATE INDEX idx_challenge_events_session_id ON challenge_events (session_id);
      CREATE INDEX idx_challenge_events_created_at ON challenge_events (created_at DESC);
    `);

    await queryRunner.query(`
      CREATE TABLE premium_intents (
        id UUID PRIMARY KEY,
        session_id UUID REFERENCES anonymous_sessions(id) ON DELETE SET NULL,
        report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
        kind VARCHAR(64) NOT NULL,
        payload JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_premium_intents_session_id ON premium_intents (session_id);
      CREATE INDEX idx_premium_intents_report_id ON premium_intents (report_id);
      CREATE INDEX idx_premium_intents_created_at ON premium_intents (created_at DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS premium_intents`);
    await queryRunner.query(`DROP TABLE IF EXISTS challenge_events`);
    await queryRunner.query(`DROP TABLE IF EXISTS challenge_links`);
    await queryRunner.query(`DROP TABLE IF EXISTS share_events`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_share_links_session_id`);
    await queryRunner.query(`ALTER TABLE share_links DROP COLUMN IF EXISTS session_id`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_reports_public_slug`);
    await queryRunner.query(`
      ALTER TABLE reports
        DROP COLUMN IF EXISTS platform_metadata,
        DROP COLUMN IF EXISTS variant_id,
        DROP COLUMN IF EXISTS public_slug;
    `);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_analytics_events_ingest_source`);
    await queryRunner.query(
      `ALTER TABLE analytics_events DROP CONSTRAINT IF EXISTS uq_analytics_events_client_event_id`,
    );
    await queryRunner.query(`
      ALTER TABLE analytics_events
        DROP COLUMN IF EXISTS ingest_source,
        DROP COLUMN IF EXISTS client_event_id;
    `);
  }
}
