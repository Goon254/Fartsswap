import type { MigrationInterface, QueryRunner } from 'typeorm';

export class ArtifactCommercePremiumIntents1737700000000 implements MigrationInterface {
  name = 'ArtifactCommercePremiumIntents1737700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE premium_intents
        ADD COLUMN IF NOT EXISTS lifecycle_state VARCHAR(48) NOT NULL DEFAULT 'intent_created',
        ADD COLUMN IF NOT EXISTS commerce_theme_code VARCHAR(64) NULL,
        ADD COLUMN IF NOT EXISTS product_sku VARCHAR(64) NULL,
        ADD COLUMN IF NOT EXISTS amount_cents INT NULL,
        ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'USD',
        ADD COLUMN IF NOT EXISTS checkout_external_id VARCHAR(128) NULL,
        ADD COLUMN IF NOT EXISTS fulfillment_ref VARCHAR(128) NULL,
        ADD COLUMN IF NOT EXISTS fulfilled_at TIMESTAMPTZ NULL,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_premium_intents_lifecycle_state
        ON premium_intents (lifecycle_state, created_at DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_premium_intents_lifecycle_state`);
    await queryRunner.query(`
      ALTER TABLE premium_intents
        DROP COLUMN IF EXISTS updated_at,
        DROP COLUMN IF EXISTS fulfilled_at,
        DROP COLUMN IF EXISTS fulfillment_ref,
        DROP COLUMN IF EXISTS checkout_external_id,
        DROP COLUMN IF EXISTS currency,
        DROP COLUMN IF EXISTS amount_cents,
        DROP COLUMN IF EXISTS product_sku,
        DROP COLUMN IF EXISTS commerce_theme_code,
        DROP COLUMN IF EXISTS lifecycle_state;
    `);
  }
}
