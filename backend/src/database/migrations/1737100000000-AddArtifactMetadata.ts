import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddArtifactMetadata1737100000000 implements MigrationInterface {
  name = 'AddArtifactMetadata1737100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE report_artifacts
        ADD COLUMN style_variant VARCHAR(64),
        ADD COLUMN failure_reason TEXT,
        ADD COLUMN completed_at TIMESTAMPTZ,
        ADD COLUMN failed_at TIMESTAMPTZ;
    `);
    await queryRunner.query(`
      CREATE INDEX idx_report_artifacts_status ON report_artifacts (status);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_report_artifacts_status`);
    await queryRunner.query(`
      ALTER TABLE report_artifacts
        DROP COLUMN IF EXISTS style_variant,
        DROP COLUMN IF EXISTS failure_reason,
        DROP COLUMN IF EXISTS completed_at,
        DROP COLUMN IF EXISTS failed_at;
    `);
  }
}
