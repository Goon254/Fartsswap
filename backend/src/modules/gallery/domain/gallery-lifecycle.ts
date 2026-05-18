export const GALLERY_SUBMISSION_STATUSES = [
  'submitted_for_review',
  'approved',
  'rejected',
  'published',
  'reported',
  'removed',
] as const;

export type GallerySubmissionStatus = (typeof GALLERY_SUBMISSION_STATUSES)[number];

export function canSubmitFromStatus(status: GallerySubmissionStatus | undefined): boolean {
  if (status === undefined) return true;
  return status === 'rejected' || status === 'removed';
}
