import {
  GALLERY_USER_REPORT_REASONS,
  isGalleryOperatorReasonCode,
  isGalleryUserReportReason,
  runGalleryAutomatedScreeningStub,
} from './moderation-policy';

describe('moderation-policy', () => {
  it('validates user report reasons', () => {
    expect(isGalleryUserReportReason('spam')).toBe(true);
    expect(isGalleryUserReportReason('not_a_reason')).toBe(false);
    expect(GALLERY_USER_REPORT_REASONS).toContain('policy_other');
  });

  it('accepts operator superset', () => {
    expect(isGalleryOperatorReasonCode('legal_takedown')).toBe(true);
    expect(isGalleryOperatorReasonCode('spam')).toBe(true);
  });

  it('stub screening is versioned', () => {
    const r = runGalleryAutomatedScreeningStub();
    expect(r.pipelineVersion).toBe(1);
    expect(r.passed).toBe(true);
  });
});
