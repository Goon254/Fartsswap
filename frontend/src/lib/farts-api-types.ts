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

/** Mirrors backend `ChallengeResponseDto`. */
export interface ChallengeResponseDto {
  id: string;
  sessionId?: string;
  reportId?: string;
  variantId: string;
  sourceScore: number;
  challengeType: string;
  sourceSurface: string;
  issuedAt: string;
  resolvedAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
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

export interface ApiErrorBody {
  error?: string;
  message?: string | string[];
  statusCode?: number;
}
