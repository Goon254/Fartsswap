import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAudioUploads1737200000000 implements MigrationInterface {
  name = 'AddAudioUploads1737200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE audio_uploads (
        id UUID PRIMARY KEY,
        report_id UUID REFERENCES reports(id) ON DELETE SET NULL,
        session_id UUID REFERENCES anonymous_sessions(id) ON DELETE SET NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'uploaded',
        storage_key VARCHAR(512) NOT NULL,
        mime_type VARCHAR(128) NOT NULL,
        size_bytes INTEGER NOT NULL,
        duration_seconds NUMERIC(6,2),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        processed_at TIMESTAMPTZ,
        deleted_at TIMESTAMPTZ
      );
      CREATE INDEX idx_audio_uploads_report_id ON audio_uploads (report_id);
      CREATE INDEX idx_audio_uploads_session_id ON audio_uploads (session_id);
      CREATE INDEX idx_audio_uploads_status ON audio_uploads (status);
    `);

    await queryRunner.query(`
      ALTER TABLE report_inputs
        ADD COLUMN audio_upload_id UUID REFERENCES audio_uploads(id) ON DELETE SET NULL;
      CREATE INDEX idx_report_inputs_audio_upload_id ON report_inputs (audio_upload_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_report_inputs_audio_upload_id`);
    await queryRunner.query(`ALTER TABLE report_inputs DROP COLUMN IF EXISTS audio_upload_id`);
    await queryRunner.query(`DROP TABLE IF EXISTS audio_uploads`);
  }
}
