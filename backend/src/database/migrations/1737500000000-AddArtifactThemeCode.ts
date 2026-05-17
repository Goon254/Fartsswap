import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddArtifactThemeCode1737500000000 implements MigrationInterface {
  name = 'AddArtifactThemeCode1737500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE report_artifacts
        ADD COLUMN theme_code VARCHAR(64);
      CREATE INDEX idx_report_artifacts_report_type_theme
        ON report_artifacts (report_id, type, theme_code);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_report_artifacts_report_type_theme`);
    await queryRunner.query(`ALTER TABLE report_artifacts DROP COLUMN IF EXISTS theme_code`);
  }
}
