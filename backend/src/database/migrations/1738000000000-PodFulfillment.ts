import type { MigrationInterface, QueryRunner } from 'typeorm';

export class PodFulfillment1738000000000 implements MigrationInterface {
  name = 'PodFulfillment1738000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE pod_fulfillment_orders (
        id UUID PRIMARY KEY,
        premium_intent_id UUID NOT NULL REFERENCES premium_intents(id) ON DELETE CASCADE,
        session_id UUID REFERENCES anonymous_sessions(id) ON DELETE SET NULL,
        report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
        status VARCHAR(32) NOT NULL
          CHECK (status IN (
            'submitted',
            'accepted',
            'in_production',
            'shipped',
            'delivered',
            'failed',
            'canceled'
          )),
        provider_code VARCHAR(32) NOT NULL DEFAULT 'mock',
        provider_order_ref VARCHAR(160),
        packaged_assets JSONB NOT NULL DEFAULT '{}'::jsonb,
        shipping_summary JSONB,
        currency VARCHAR(3) NOT NULL DEFAULT 'USD',
        amount_cents INT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_pod_fulfillment_orders_intent UNIQUE (premium_intent_id)
      );
      CREATE INDEX idx_pod_fulfillment_orders_status ON pod_fulfillment_orders (status, created_at DESC);
    `);

    await queryRunner.query(`
      CREATE TABLE pod_fulfillment_order_items (
        id UUID PRIMARY KEY,
        order_id UUID NOT NULL REFERENCES pod_fulfillment_orders(id) ON DELETE CASCADE,
        pod_product_type VARCHAR(48) NOT NULL,
        commerce_sku VARCHAR(96) NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        personalization JSONB NOT NULL DEFAULT '{}'::jsonb,
        provider_line_ref VARCHAR(160),
        line_status VARCHAR(32) NOT NULL DEFAULT 'pending'
          CHECK (line_status IN ('pending', 'submitted', 'in_production', 'shipped', 'delivered', 'failed', 'canceled')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_pod_fulfillment_order_items_order ON pod_fulfillment_order_items (order_id);
    `);

    await queryRunner.query(`
      CREATE TABLE pod_fulfillment_events (
        id UUID PRIMARY KEY,
        order_id UUID NOT NULL REFERENCES pod_fulfillment_orders(id) ON DELETE CASCADE,
        previous_status VARCHAR(32),
        new_status VARCHAR(32) NOT NULL,
        reason VARCHAR(160),
        metadata JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_pod_fulfillment_events_order ON pod_fulfillment_events (order_id, created_at DESC);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS pod_fulfillment_events`);
    await queryRunner.query(`DROP TABLE IF EXISTS pod_fulfillment_order_items`);
    await queryRunner.query(`DROP TABLE IF EXISTS pod_fulfillment_orders`);
  }
}
