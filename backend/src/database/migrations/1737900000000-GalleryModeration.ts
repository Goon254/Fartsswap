import type { MigrationInterface, QueryRunner } from 'typeorm';

export class GalleryModeration1737900000000 implements MigrationInterface {
  name = 'GalleryModeration1737900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE gallery_submissions (
        id UUID PRIMARY KEY,
        report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
        report_artifact_id UUID REFERENCES report_artifacts(id) ON DELETE SET NULL,
        submitter_session_id UUID NOT NULL REFERENCES anonymous_sessions(id) ON DELETE CASCADE,
        status VARCHAR(32) NOT NULL
          CHECK (status IN (
            'submitted_for_review',
            'approved',
            'rejected',
            'published',
            'reported',
            'removed'
          )),
        listed BOOLEAN NOT NULL DEFAULT true,
        featured_rank INT,
        automated_screening JSONB NOT NULL DEFAULT '{}'::jsonb,
        operator_notes TEXT,
        last_reason_code VARCHAR(64),
        submitted_at TIMESTAMPTZ NOT NULL,
        published_at TIMESTAMPTZ,
        removed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_gallery_submissions_report UNIQUE (report_id)
      );
      CREATE INDEX idx_gallery_submissions_status_submitted
        ON gallery_submissions (status, submitted_at DESC);
      CREATE INDEX idx_gallery_submissions_published_listed
        ON gallery_submissions (status, listed, featured_rank, published_at DESC);
    `);

    await queryRunner.query(`
      CREATE TABLE gallery_decision_logs (
        id UUID PRIMARY KEY,
        submission_id UUID NOT NULL REFERENCES gallery_submissions(id) ON DELETE CASCADE,
        action VARCHAR(48) NOT NULL,
        actor_kind VARCHAR(16) NOT NULL CHECK (actor_kind IN ('system', 'operator', 'user')),
        actor_ref VARCHAR(128),
        from_status VARCHAR(32),
        to_status VARCHAR(32),
        reason_code VARCHAR(64),
        notes TEXT,
        metadata JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_gallery_decision_logs_submission ON gallery_decision_logs (submission_id, created_at DESC);
    `);

    await queryRunner.query(`
      CREATE TABLE gallery_item_reports (
        id UUID PRIMARY KEY,
        submission_id UUID NOT NULL REFERENCES gallery_submissions(id) ON DELETE CASCADE,
        reporter_session_id UUID NOT NULL REFERENCES anonymous_sessions(id) ON DELETE CASCADE,
        reason_code VARCHAR(64) NOT NULL,
        details TEXT,
        resolved_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT uq_gallery_item_report_once UNIQUE (submission_id, reporter_session_id)
      );
      CREATE INDEX idx_gallery_item_reports_open ON gallery_item_reports (submission_id) WHERE resolved_at IS NULL;
    `);

    await queryRunner.query(`
      CREATE TABLE gallery_session_blocks (
        id UUID PRIMARY KEY,
        session_id UUID NOT NULL REFERENCES anonymous_sessions(id) ON DELETE CASCADE,
        restriction_kind VARCHAR(32) NOT NULL
          CHECK (restriction_kind IN ('gallery_submit', 'gallery_report')),
        reason_code VARCHAR(64) NOT NULL,
        notes TEXT,
        created_by VARCHAR(128),
        expires_at TIMESTAMPTZ,
        revoked_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX idx_gallery_session_blocks_active
        ON gallery_session_blocks (session_id, restriction_kind)
        WHERE revoked_at IS NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS gallery_session_blocks`);
    await queryRunner.query(`DROP TABLE IF EXISTS gallery_item_reports`);
    await queryRunner.query(`DROP TABLE IF EXISTS gallery_decision_logs`);
    await queryRunner.query(`DROP TABLE IF EXISTS gallery_submissions`);
  }
}
