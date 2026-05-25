/** Mirrors backend `AudioUploadResponseDto`. */
export interface AudioUploadResponseDto {
  id: string;
  reportId?: string;
  sessionId?: string;
  status: string;
  mimeType: string;
  sizeBytes: number;
  durationSeconds?: number;
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
}

/** Mirrors backend `ReportResponseDto`. */
export interface ReportResponseDto {
  id: string;
  sessionId?: string;
  status: string;
  source: string;
  fartName: string;
  classification: string;
  powerScore: number;
  durationMs: number;
  emotionalTone: string;
  probableCause: string;
  cinematicParallel: string;
  threatLevel: string;
  fartHash: string;
  createdAt: string;
  updatedAt: string;
  publicSlug?: string;
  variantId?: string;
  completedAt?: string;
  /** True when GET /api/reports/:reportId/audio may stream for this session. */
  playbackAvailable?: boolean;
  audioContentType?: string;
}

/** Mirrors backend `CreateReportFromAudioDto`. */
export interface CreateReportFromAudioBody {
  audioUploadId: string;
  customFartName?: string;
  tonePreset?: string;
}

/** Mirrors backend `ArtifactResponseDto`. */
export interface ArtifactResponseDto {
  id: string;
  reportId: string;
  type: string;
  status: string;
  storageKey?: string;
  mimeType?: string;
  styleVariant?: string;
  themeCode?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  failedAt?: string;
  retrievalUrl?: string;
  contentUrl?: string;
}

/** Report artifact list (`GET /api/v1/reports/:reportId/artifacts`). */
export type ArtifactListResponseDto = ArtifactResponseDto[];

export interface ChallengeReportSummaryDto {
  reportId: string;
  fartName: string;
  classification: string;
  powerScore: number;
  threatLevel: string;
  probableCause: string;
  emotionalTone?: string;
  playbackAvailable: boolean;
  audioContentType?: string;
}

/** Mirrors backend `ChallengeDetailResponseDto`. */
export interface ChallengeResponseDto {
  id: string;
  sessionId?: string;
  reportId?: string;
  responseReportId?: string;
  variantId: string;
  sourceScore: number;
  challengeType: string;
  sourceSurface: string;
  issuedAt: string;
  resolvedAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  challengerReport?: ChallengeReportSummaryDto;
  responseReport?: ChallengeReportSummaryDto;
}

/** Mirrors backend `RegisterChallengeBodyDto`. */
export interface CreateChallengeBody {
  id: string;
  reportId?: string;
  variantId: string;
  sourceScore: number;
  challengeType: string;
  sourceSurface: string;
  issuedAt: string;
  metadata?: Record<string, unknown>;
}

/** Mirrors backend `CreateShareLinkResponseDto`. */
export interface CreateShareLinkResponseDto {
  id: string;
  reportId: string;
  sessionId?: string;
  token: string;
  createdAt: string;
}

/** Mirrors backend `RecordPremiumIntentBodyDto`. */
export interface RecordPremiumIntentBodyDto {
  kind: string;
  reportId?: string;
  payload?: Record<string, unknown>;
  lifecycleState?: string;
  commerceThemeCode?: string;
  productSku?: string;
  amountCents?: number;
  currency?: string;
}

/** Mirrors backend `PremiumIntentResponseDto`. */
export interface PremiumIntentResponseDto {
  id: string;
  sessionId?: string;
  reportId?: string;
  kind: string;
  payload?: Record<string, unknown>;
  createdAt: string;
  lifecycleState?: string;
  commerceThemeCode?: string;
  productSku?: string;
  amountCents?: number;
  currency?: string;
  checkoutExternalId?: string;
  fulfillmentRef?: string;
  fulfilledAt?: string;
  updatedAt?: string;
}

/** Gallery submission lifecycle status (mirrors backend). */
export type GallerySubmissionStatus =
  | 'submitted_for_review'
  | 'approved'
  | 'rejected'
  | 'published'
  | 'reported'
  | 'removed';

export interface GallerySubmissionRow {
  id: string;
  reportId: string;
  reportArtifactId?: string;
  submitterSessionId: string;
  status: GallerySubmissionStatus;
  listed: boolean;
  featuredRank?: number;
  submittedAt: string;
  publishedAt?: string;
  removedAt?: string;
  lastReasonCode?: string;
  operatorNotes?: string;
}

export interface GallerySubmissionResponse {
  submission: GallerySubmissionRow | null;
}

/** Ops moderation queue item (includes dossier summary). */
export interface GalleryOpsSubmissionDetail extends GallerySubmissionRow {
  report: {
    fartName: string;
    classification: string;
    powerScore: number;
    publicSlug?: string;
    variantId?: string;
    status: string;
  };
  openReportCount: number;
  playbackAvailable: boolean;
  audioContentType?: string;
}

export interface GalleryOpsQueueResponse {
  items: GalleryOpsSubmissionDetail[];
}

export interface GalleryPublicFeedItem {
  submissionId: string;
  reportId: string;
  publicSlug?: string;
  variantId?: string;
  fartName: string;
  probableCause: string;
  emotionalTone?: string;
  specimenLabel: string;
  classification: string;
  powerScore: number;
  threatLevel: string;
  artifactType?: string;
  themeCode?: string;
  featuredRank?: number;
  publishedAt: string;
  audioAvailable: boolean;
  audioContentType?: string;
}

export interface GalleryPublicFeedResponse {
  enabled: boolean;
  items: GalleryPublicFeedItem[];
}

export type GalleryUserReportReason =
  | 'explicit_content'
  | 'harassment'
  | 'slur_or_hate'
  | 'minor_safety'
  | 'copyrighted_audio_or_music'
  | 'spam'
  | 'impersonation'
  | 'policy_other';

export interface GalleryReportFiledResponse {
  ok: true;
}

export type FartmaxVoteDirection = 'up' | 'down';

export interface FartmaxMealDto {
  id: string;
  name: string;
  description: string;
  votes: number;
  upvoteCount: number;
  downvoteCount: number;
  createdAt: string;
}

export interface FartmaximizerLeaderboardResponse {
  enabled: boolean;
  meals: FartmaxMealDto[];
  myVotes: Record<string, FartmaxVoteDirection>;
}

export interface ApiErrorBody {
  error?: string;
  message?: string | string[];
  statusCode?: number;
}
