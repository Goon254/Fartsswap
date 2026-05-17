import type {
  AnalyticsEventType,
  ArtifactStatus,
  ArtifactType,
  AudioStatus,
  EntitlementType,
  ReportSource,
  ReportStatus,
} from './types';
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
  failureReason?: string;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  completedAt?: IsoDateTime;
  failedAt?: IsoDateTime;
}

export interface ShareLink {
  id: EntityId;
  reportId: EntityId;
  token: string;
  expiresAt?: IsoDateTime;
  createdAt: IsoDateTime;
  revokedAt?: IsoDateTime;
}

export interface AnalyticsEvent {
  id: EntityId;
  sessionId?: EntityId;
  reportId?: EntityId;
  eventType: AnalyticsEventType;
  payload?: Record<string, unknown>;
  createdAt: IsoDateTime;
}

export interface Entitlement {
  id: EntityId;
  sessionId?: EntityId;
  type: EntitlementType;
  grantedAt: IsoDateTime;
  expiresAt?: IsoDateTime;
  metadata?: Record<string, unknown>;
}
