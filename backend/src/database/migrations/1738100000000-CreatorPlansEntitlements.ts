import type { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatorPlansEntitlements1738100000000 implements MigrationInterface {
  name = 'CreatorPlansEntitlements1738100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE creator_subscription_plans (
        id UUID PRIMARY KEY,
        code VARCHAR(64) NOT NULL UNIQUE,
        display_name VARCHAR(160) NOT NULL,
        description TEXT,
        audience VARCHAR(32) NOT NULL
          CHECK (audience IN ('creator', 'community', 'party_host', 'brand')),
        active BOOLEAN NOT NULL DEFAULT true,
        sort_order INT NOT NULL DEFAULT 0,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE creator_subscription_plan_features (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        plan_id UUID NOT NULL REFERENCES creator_subscription_plans(id) ON DELETE CASCADE,
        feature_key VARCHAR(64) NOT NULL,
        limit_per_period INT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_plan_feature UNIQUE (plan_id, feature_key)
      );
      CREATE INDEX idx_creator_plan_features_plan ON creator_subscription_plan_features (plan_id);
    `);

    await queryRunner.query(`
      CREATE TABLE billing_customers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        holder_kind VARCHAR(32) NOT NULL CHECK (holder_kind IN ('anonymous_session')),
        holder_id UUID NOT NULL REFERENCES anonymous_sessions(id) ON DELETE CASCADE,
        provider_code VARCHAR(32) NOT NULL DEFAULT 'mock',
        external_ref VARCHAR(160) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_billing_customer_holder_provider UNIQUE (holder_kind, holder_id, provider_code)
      );
    `);

    await queryRunner.query(`
      CREATE TABLE creator_subscriptions (
        id UUID PRIMARY KEY,
        plan_id UUID NOT NULL REFERENCES creator_subscription_plans(id) ON DELETE RESTRICT,
        holder_kind VARCHAR(32) NOT NULL CHECK (holder_kind IN ('anonymous_session')),
        holder_id UUID NOT NULL REFERENCES anonymous_sessions(id) ON DELETE CASCADE,
        status VARCHAR(24) NOT NULL
          CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'expired')),
        billing_provider VARCHAR(32) NOT NULL DEFAULT 'mock',
        billing_customer_ref VARCHAR(160),
        billing_subscription_ref VARCHAR(160),
        current_period_start TIMESTAMPTZ NOT NULL,
        current_period_end TIMESTAMPTZ NOT NULL,
        cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE UNIQUE INDEX uq_creator_sub_one_active
        ON creator_subscriptions (holder_kind, holder_id)
        WHERE status IN ('trialing', 'active', 'past_due');
      CREATE INDEX idx_creator_subscriptions_plan ON creator_subscriptions (plan_id, status);
    `);

    await queryRunner.query(`
      CREATE TABLE creator_subscription_usage_periods (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        subscription_id UUID NOT NULL REFERENCES creator_subscriptions(id) ON DELETE CASCADE,
        feature_key VARCHAR(64) NOT NULL,
        period_key VARCHAR(16) NOT NULL,
        used_count INT NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_usage_period UNIQUE (subscription_id, feature_key, period_key)
      );
      CREATE INDEX idx_creator_usage_sub ON creator_subscription_usage_periods (subscription_id, period_key);
    `);

    await queryRunner.query(`
      CREATE TABLE billing_lifecycle_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        subscription_id UUID REFERENCES creator_subscriptions(id) ON DELETE SET NULL,
        holder_kind VARCHAR(32),
        holder_id UUID,
        event_type VARCHAR(48) NOT NULL,
        payload JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_billing_lifecycle_sub ON billing_lifecycle_events (subscription_id, created_at DESC);
    `);

    await queryRunner.query(`
      INSERT INTO creator_subscription_plans (id, code, display_name, description, audience, sort_order)
      VALUES
        ('11111111-1111-4111-8111-111111111101', 'creator_plan', 'Creator Plan',
         'Streamers & solo creators: higher automation caps and export runway.', 'creator', 10),
        ('11111111-1111-4111-8111-111111111102', 'community_plan', 'Community Plan',
         'Discord communities: bulletin + badge automation at community scale.', 'community', 20),
        ('11111111-1111-4111-8111-111111111103', 'party_host_pack', 'Party Host Pack',
         'Event hosts: QR wall / event mode emphasis with sensible batch caps.', 'party_host', 30),
        ('11111111-1111-4111-8111-111111111104', 'brand_campaign_pack', 'Brand / Campaign Pack',
         'Brand-safe campaign tooling and automation without touching core diagnostics.', 'brand', 40);
    `);

    const insFeat = (planId: string, key: string, lim: string | null) =>
      `INSERT INTO creator_subscription_plan_features (plan_id, feature_key, limit_per_period)
       VALUES ('${planId}'::uuid, '${key}', ${lim === null ? 'NULL' : lim});`;

    const P_CREATOR = '11111111-1111-4111-8111-111111111101';
    const P_COMMUNITY = '11111111-1111-4111-8111-111111111102';
    const P_PARTY = '11111111-1111-4111-8111-111111111103';
    const P_BRAND = '11111111-1111-4111-8111-111111111104';

    await queryRunner.query(
      [
        insFeat(P_CREATOR, 'batch_generation', '80'),
        insFeat(P_CREATOR, 'transparent_png_export', '200'),
        insFeat(P_CREATOR, 'server_bulletin_automation', '2000'),
        insFeat(P_CREATOR, 'badge_leaderboard_automation', '400'),
        insFeat(P_CREATOR, 'event_mode_qr_wall', '60'),
        insFeat(P_CREATOR, 'custom_campaign_tooling', '40'),
        insFeat(P_COMMUNITY, 'batch_generation', '25'),
        insFeat(P_COMMUNITY, 'transparent_png_export', '80'),
        insFeat(P_COMMUNITY, 'server_bulletin_automation', '800'),
        insFeat(P_COMMUNITY, 'badge_leaderboard_automation', '200'),
        insFeat(P_COMMUNITY, 'event_mode_qr_wall', '20'),
        insFeat(P_COMMUNITY, 'custom_campaign_tooling', '10'),
        insFeat(P_PARTY, 'batch_generation', '40'),
        insFeat(P_PARTY, 'transparent_png_export', '120'),
        insFeat(P_PARTY, 'server_bulletin_automation', '400'),
        insFeat(P_PARTY, 'badge_leaderboard_automation', '120'),
        insFeat(P_PARTY, 'event_mode_qr_wall', '200'),
        insFeat(P_PARTY, 'custom_campaign_tooling', '15'),
        insFeat(P_BRAND, 'batch_generation', '120'),
        insFeat(P_BRAND, 'transparent_png_export', '400'),
        insFeat(P_BRAND, 'server_bulletin_automation', '5000'),
        insFeat(P_BRAND, 'badge_leaderboard_automation', '800'),
        insFeat(P_BRAND, 'event_mode_qr_wall', '100'),
        insFeat(P_BRAND, 'custom_campaign_tooling', '200'),
      ].join('\n'),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS billing_lifecycle_events`);
    await queryRunner.query(`DROP TABLE IF EXISTS creator_subscription_usage_periods`);
    await queryRunner.query(`DROP TABLE IF EXISTS creator_subscriptions`);
    await queryRunner.query(`DROP TABLE IF EXISTS billing_customers`);
    await queryRunner.query(`DROP TABLE IF EXISTS creator_subscription_plan_features`);
    await queryRunner.query(`DROP TABLE IF EXISTS creator_subscription_plans`);
  }
}
