import type { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1737000000000 implements MigrationInterface {
  name = 'InitialSchema1737000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE anonymous_sessions (
        id UUID PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL,
        metadata JSONB
      );
      CREATE INDEX idx_anonymous_sessions_expires_at ON anonymous_sessions (expires_at);
    `);

    await queryRunner.query(`
      CREATE TABLE reports (
        id UUID PRIMARY KEY,
        session_id UUID REFERENCES anonymous_sessions(id) ON DELETE SET NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'pending',
        source VARCHAR(32) NOT NULL,
        fart_name VARCHAR(255) NOT NULL,
        classification VARCHAR(128) NOT NULL,
        power_score SMALLINT NOT NULL CHECK (power_score >= 0 AND power_score <= 100),
        duration_ms INTEGER NOT NULL DEFAULT 0,
        emotional_tone VARCHAR(255) NOT NULL,
        probable_cause VARCHAR(512) NOT NULL,
        cinematic_parallel VARCHAR(512) NOT NULL,
        threat_level VARCHAR(64) NOT NULL,
        fart_hash VARCHAR(128) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        completed_at TIMESTAMPTZ
      );
      CREATE INDEX idx_reports_session_id ON reports (session_id);
      CREATE INDEX idx_reports_created_at ON reports (created_at DESC);
      CREATE INDEX idx_reports_status ON reports (status);
    `);

    await queryRunner.query(`
      CREATE TABLE report_inputs (
        id UUID PRIMARY KEY,
        report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
        custom_fart_name VARCHAR(255),
        tone_preset VARCHAR(64),
        duration_ms INTEGER,
        source VARCHAR(32) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_report_inputs_report_id ON report_inputs (report_id);
    `);

    await queryRunner.query(`
      CREATE TABLE report_artifacts (
        id UUID PRIMARY KEY,
        report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
        type VARCHAR(64) NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'pending',
        storage_key VARCHAR(512),
        mime_type VARCHAR(128),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_report_artifacts_report_id ON report_artifacts (report_id);
    `);

    await queryRunner.query(`
      CREATE TABLE share_links (
        id UUID PRIMARY KEY,
        report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
        token VARCHAR(64) NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        revoked_at TIMESTAMPTZ
      );
      CREATE INDEX idx_share_links_report_id ON share_links (report_id);
      CREATE INDEX idx_share_links_token ON share_links (token);
    `);

    await queryRunner.query(`
      CREATE TABLE analytics_events (
        id UUID PRIMARY KEY,
        session_id UUID REFERENCES anonymous_sessions(id) ON DELETE SET NULL,
        report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
        event_type VARCHAR(128) NOT NULL,
        payload JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_analytics_events_report_id ON analytics_events (report_id);
      CREATE INDEX idx_analytics_events_session_id ON analytics_events (session_id);
      CREATE INDEX idx_analytics_events_event_type ON analytics_events (event_type);
      CREATE INDEX idx_analytics_events_created_at ON analytics_events (created_at DESC);
    `);

    await queryRunner.query(`
      CREATE TABLE entitlements (
        id UUID PRIMARY KEY,
        session_id UUID REFERENCES anonymous_sessions(id) ON DELETE SET NULL,
        type VARCHAR(64) NOT NULL,
        granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ,
        metadata JSONB
      );
      CREATE INDEX idx_entitlements_session_id ON entitlements (session_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS entitlements`);
    await queryRunner.query(`DROP TABLE IF EXISTS analytics_events`);
    await queryRunner.query(`DROP TABLE IF EXISTS share_links`);
    await queryRunner.query(`DROP TABLE IF EXISTS report_artifacts`);
    await queryRunner.query(`DROP TABLE IF EXISTS report_inputs`);
    await queryRunner.query(`DROP TABLE IF EXISTS reports`);
    await queryRunner.query(`DROP TABLE IF EXISTS anonymous_sessions`);
  }
}
