import type { MigrationInterface, QueryRunner } from 'typeorm';

export class ChallengeResponseReport1738200000000 implements MigrationInterface {
  name = 'ChallengeResponseReport1738200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE challenge_links
        ADD COLUMN IF NOT EXISTS response_report_id UUID REFERENCES reports(id) ON DELETE SET NULL;
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_challenge_links_response_report_id
        ON challenge_links (response_report_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_challenge_links_response_report_id`);
    await queryRunner.query(`
      ALTER TABLE challenge_links DROP COLUMN IF EXISTS response_report_id;
    `);
  }
}
