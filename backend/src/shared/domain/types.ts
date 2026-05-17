export type EntityId = string;

export type IsoDateTime = string;

export enum ReportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum ReportSource {
  FAKE = 'fake',
  RECORDED = 'recorded',
  UPLOADED = 'uploaded',
  AUDIO_RECORDING = 'audio_recording',
}

export enum AudioStatus {
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  DELETED = 'deleted',
  FAILED = 'failed',
}

export enum ArtifactType {
  SHARE_CARD = 'share_card',
  /** Reserved for Phase 3+ — not generated in Phase 2 */
  PDF_CERTIFICATE = 'pdf_certificate',
  WAVEFORM = 'waveform',
}

export enum ArtifactStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  READY = 'ready',
  FAILED = 'failed',
}

export enum ShareCardStyleVariant {
  DEFAULT = 'default',
  CLINICAL = 'clinical',
  DRAMATIC = 'dramatic',
}

export enum EntitlementType {
  PREMIUM_REPORT = 'premium_report',
  PDF_EXPORT = 'pdf_export',
  THEME_PACK = 'theme_pack',
}

export enum AnalyticsEventType {
  REPORT_GENERATED = 'report.generated',
  REPORT_VIEWED = 'report.viewed',
  REPORT_EXPORTED = 'report.exported',
  REPORT_SHARED = 'report.shared',
  ARTIFACT_GENERATION_REQUESTED = 'artifact.generation_requested',
  ARTIFACT_GENERATED = 'artifact.generated',
  ARTIFACT_GENERATION_FAILED = 'artifact.generation_failed',
  ARTIFACT_VIEWED = 'artifact.viewed',
  AUDIO_UPLOAD_REQUESTED = 'audio.upload_requested',
  AUDIO_UPLOADED = 'audio.uploaded',
  AUDIO_UPLOAD_FAILED = 'audio.upload_failed',
  REPORT_CREATED_FROM_AUDIO = 'report.created_from_audio',
}
