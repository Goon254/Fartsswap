/** Mirrors backend `GALLERY_USER_REPORT_REASONS` (public flag flow). */
export const GALLERY_USER_REPORT_REASONS = [
  'explicit_content',
  'harassment',
  'slur_or_hate',
  'minor_safety',
  'copyrighted_audio_or_music',
  'spam',
  'impersonation',
  'policy_other',
] as const;

export type GalleryUserReportReason = (typeof GALLERY_USER_REPORT_REASONS)[number];

export const GALLERY_REPORT_REASON_LABELS: Record<GalleryUserReportReason, string> = {
  explicit_content: 'Explicit content',
  harassment: 'Harassment',
  slur_or_hate: 'Slurs or hate',
  minor_safety: 'Minor safety',
  copyrighted_audio_or_music: 'Copyrighted audio',
  spam: 'Spam',
  impersonation: 'Impersonation',
  policy_other: 'Other policy concern',
};
