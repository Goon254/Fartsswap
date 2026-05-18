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
  /** Single-page PDF diagnostic dossier (Phase 7). */
  REPORT_PDF = 'report_pdf',
  /** Reserved — not generated yet. */
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
  AI_REPORT_REQUESTED = 'ai.report_requested',
  AI_REPORT_SUCCEEDED = 'ai.report_succeeded',
  AI_REPORT_FAILED = 'ai.report_failed',
  PDF_ARTIFACT_REQUESTED = 'pdf.artifact_requested',
  PDF_ARTIFACT_GENERATED = 'pdf.artifact_generated',
  PDF_ARTIFACT_FAILED = 'pdf.artifact_failed',
  /** Artifact commerce funnel (server + aligned client catalog). */
  PREMIUM_OFFER_VIEWED = 'premium.offer_viewed',
  PREMIUM_THEME_SELECTED = 'premium.theme_selected',
  CERTIFICATE_PREVIEWED = 'premium.certificate_previewed',
  CHECKOUT_STARTED = 'premium.checkout_started',
  CHECKOUT_COMPLETED = 'premium.checkout_completed',
  ARTIFACT_FULFILLED = 'premium.artifact_fulfilled',
  /** Native sponsorship (ceremonial inventory only). */
  SPONSORED_INVENTORY_SERVED = 'sponsorship.inventory_served',
  SPONSORED_INVENTORY_CLICKED = 'sponsorship.inventory_clicked',
  SPONSORED_BADGE_ISSUED = 'sponsorship.badge_issued',
  SPONSORED_CHALLENGE_OPENED = 'sponsorship.challenge_opened',
  CAMPAIGN_PREVIEW_RENDERED = 'sponsorship.campaign_preview_rendered',
  /** Opt-in public gallery pipeline (moderation + publication only — no social graph). */
  GALLERY_SUBMISSION_CREATED = 'gallery_submission_created',
  GALLERY_SUBMISSION_APPROVED = 'gallery_submission_approved',
  GALLERY_SUBMISSION_REJECTED = 'gallery_submission_rejected',
  GALLERY_REPORT_FILED = 'gallery_report_filed',
  GALLERY_ITEM_REMOVED = 'gallery_item_removed',
  GALLERY_ITEM_FEATURED = 'gallery_item_featured',
  /** Print-on-demand handoff (no storefront; provider-agnostic). */
  COMMERCE_ORDER_CREATED = 'commerce_order_created',
  FULFILLMENT_SUBMITTED = 'fulfillment_submitted',
  FULFILLMENT_FAILED = 'fulfillment_failed',
  FULFILLMENT_SHIPPED = 'fulfillment_shipped',
  MERCH_ASSET_PACKAGED = 'merch_asset_packaged',
  /** Creator / community recurring plans (invite-only first). */
  PLAN_ASSIGNED = 'plan_assigned',
  ENTITLEMENT_CHECKED = 'entitlement_checked',
  SUBSCRIPTION_STARTED = 'subscription_started',
  SUBSCRIPTION_RENEWED = 'subscription_renewed',
  SUBSCRIPTION_CANCELED = 'subscription_canceled',
  GATED_FEATURE_USED = 'gated_feature_used',
}
