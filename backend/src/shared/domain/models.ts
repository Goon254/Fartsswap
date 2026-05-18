import type { ArtifactStatus, ArtifactType, AudioStatus, EntitlementType, ReportSource, ReportStatus } from './types';
import type { EntityId, IsoDateTime } from './types';

export interface AnonymousSession {
  id: EntityId;
  createdAt: IsoDateTime;
  lastSeenAt: IsoDateTime;
  expiresAt: IsoDateTime;
  metadata?: Record<string, unknown>;
}

export interface ReportInput {
  id: EntityId;
  reportId: EntityId;
  audioUploadId?: EntityId;
  customFartName?: string;
  tonePreset?: string;
  durationMs?: number;
  source: ReportSource;
  createdAt: IsoDateTime;
}

export interface AudioUpload {
  id: EntityId;
  reportId?: EntityId;
  sessionId?: EntityId;
  status: AudioStatus;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  durationSeconds?: number;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  processedAt?: IsoDateTime;
  deletedAt?: IsoDateTime;
}

export interface Report {
  id: EntityId;
  sessionId?: EntityId;
  /** Short public token for share URLs (distinct from internal UUID). */
  publicSlug?: string;
  /** Client / bureau variant id when the dossier maps to a known catalog entry. */
  variantId?: string;
  platformMetadata?: Record<string, unknown>;
  status: ReportStatus;
  source: ReportSource;
  fartName: string;
  classification: string;
  powerScore: number;
  durationMs: number;
  emotionalTone: string;
  probableCause: string;
  cinematicParallel: string;
  threatLevel: string;
  fartHash: string;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  completedAt?: IsoDateTime;
}

export interface ReportArtifact {
  id: EntityId;
  reportId: EntityId;
  type: ArtifactType;
  status: ArtifactStatus;
  storageKey?: string;
  mimeType?: string;
  styleVariant?: string;
  /** Theme code (e.g. 'default', 'clinical_gold'). Populated for REPORT_PDF artifacts. */
  themeCode?: string;
  failureReason?: string;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  completedAt?: IsoDateTime;
  failedAt?: IsoDateTime;
}

export interface ShareLink {
  id: EntityId;
  reportId: EntityId;
  sessionId?: EntityId;
  token: string;
  expiresAt?: IsoDateTime;
  createdAt: IsoDateTime;
  revokedAt?: IsoDateTime;
}

export interface ShareEvent {
  id: EntityId;
  sessionId?: EntityId;
  reportId?: EntityId;
  shareLinkId?: EntityId;
  kind: string;
  payload?: Record<string, unknown>;
  createdAt: IsoDateTime;
}

export interface ChallengeLink {
  id: string;
  sessionId?: EntityId;
  reportId?: EntityId;
  variantId: string;
  sourceScore: number;
  challengeType: string;
  sourceSurface: string;
  issuedAt: IsoDateTime;
  resolvedAt?: IsoDateTime;
  metadata?: Record<string, unknown>;
  createdAt: IsoDateTime;
}

export interface ChallengeEvent {
  id: EntityId;
  challengeLinkId: string;
  sessionId?: EntityId;
  kind: string;
  payload?: Record<string, unknown>;
  createdAt: IsoDateTime;
}

export interface PremiumIntent {
  id: EntityId;
  sessionId?: EntityId;
  reportId?: EntityId;
  kind: string;
  payload?: Record<string, unknown>;
  createdAt: IsoDateTime;
  lifecycleState?: string;
  commerceThemeCode?: string;
  productSku?: string;
  amountCents?: number;
  currency?: string;
  checkoutExternalId?: string;
  fulfillmentRef?: string;
  fulfilledAt?: IsoDateTime;
  updatedAt?: IsoDateTime;
}

export interface AnalyticsEvent {
  id: EntityId;
  sessionId?: EntityId;
  reportId?: EntityId;
  /** Server enum values (`report.generated`) or client catalog (`report_view`). */
  eventType: string;
  payload?: Record<string, unknown>;
  createdAt: IsoDateTime;
  /** When set, duplicate ingests with the same id are ignored (client-generated UUID). */
  clientEventId?: EntityId;
  ingestSource?: 'server' | 'client';
}

export interface Entitlement {
  id: EntityId;
  sessionId?: EntityId;
  type: EntitlementType;
  grantedAt: IsoDateTime;
  expiresAt?: IsoDateTime;
  metadata?: Record<string, unknown>;
}
