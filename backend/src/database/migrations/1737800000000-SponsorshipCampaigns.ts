import type { MigrationInterface, QueryRunner } from 'typeorm';

export class SponsorshipCampaigns1737800000000 implements MigrationInterface {
  name = 'SponsorshipCampaigns1737800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE sponsorship_campaigns (
        id UUID PRIMARY KEY,
        internal_name VARCHAR(160) NOT NULL,
        sponsor_public_label VARCHAR(160) NOT NULL,
        status VARCHAR(32) NOT NULL
          CHECK (status IN ('draft', 'pending_review', 'approved', 'active', 'paused', 'archived')),
        valid_from TIMESTAMPTZ NOT NULL,
        valid_until TIMESTAMPTZ NOT NULL,
        operator_notes TEXT,
        reviewed_at TIMESTAMPTZ,
        reviewed_by VARCHAR(128),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_sponsorship_campaigns_status_window
        ON sponsorship_campaigns (status, valid_from, valid_until);
    `);

    await queryRunner.query(`
      CREATE TABLE sponsorship_placements (
        id UUID PRIMARY KEY,
        campaign_id UUID NOT NULL REFERENCES sponsorship_campaigns(id) ON DELETE CASCADE,
        slot_code VARCHAR(64) NOT NULL,
        ceremonial_field VARCHAR(96) NOT NULL,
        creative_payload JSONB NOT NULL,
        display_priority INT NOT NULL DEFAULT 0,
        preview_ok BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_sponsorship_placements_campaign_slot UNIQUE (campaign_id, slot_code)
      );
      CREATE INDEX idx_sponsorship_placements_slot_priority
        ON sponsorship_placements (slot_code, display_priority DESC);
    `);

    await queryRunner.query(`
      CREATE TABLE sponsorship_attributions (
        id UUID PRIMARY KEY,
        campaign_id UUID NOT NULL REFERENCES sponsorship_campaigns(id) ON DELETE CASCADE,
        placement_id UUID REFERENCES sponsorship_placements(id) ON DELETE SET NULL,
        slot_code VARCHAR(64) NOT NULL,
        event_type VARCHAR(32) NOT NULL,
        session_id UUID REFERENCES anonymous_sessions(id) ON DELETE SET NULL,
        report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
        metadata JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_sponsorship_attr_slot_created ON sponsorship_attributions (slot_code, created_at DESC);
      CREATE INDEX idx_sponsorship_attr_campaign ON sponsorship_attributions (campaign_id, created_at DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS sponsorship_attributions`);
    await queryRunner.query(`DROP TABLE IF EXISTS sponsorship_placements`);
    await queryRunner.query(`DROP TABLE IF EXISTS sponsorship_campaigns`);
  }
}
