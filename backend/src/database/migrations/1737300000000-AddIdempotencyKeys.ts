import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIdempotencyKeys1737300000000 implements MigrationInterface {
  name = 'AddIdempotencyKeys1737300000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE idempotency_keys (
        storage_key VARCHAR(64) PRIMARY KEY,
        scope VARCHAR(64) NOT NULL,
        client_key VARCHAR(200) NOT NULL,
        session_id VARCHAR(64),
        request_hash VARCHAR(64) NOT NULL,
        response_status INTEGER NOT NULL,
        response_body JSONB NOT NULL,
        response_headers JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL
      );
      CREATE INDEX idx_idempotency_expires_at ON idempotency_keys (expires_at);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_idempotency_expires_at`);
    await queryRunner.query(`DROP TABLE IF EXISTS idempotency_keys`);
  }
}
