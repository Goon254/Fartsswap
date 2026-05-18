/**
 * Typed event catalog for the analytics layer.
 *
 * Every interaction we want to measure is declared once here as
 * `EventName → PayloadShape`. The `track()` function then enforces both
 * name and payload at compile time, so adding a new event is a single-file
 * change and renaming one breaks the build at every call site.
 *
 * Conventions:
 *  - Names are lowercase snake_case, scoped by surface (`report_view`,
 *    `share_download_succeeded`).
 *  - Surface-spanning events carry a `surface` field so we can pivot on it
 *    in the analytics store without inventing variant_switched_report /
 *    variant_switched_share copies of the same event.
 *  - Payloads NEVER carry PII or raw audio metadata. They only carry data
 *    we'd be comfortable putting in a CSV.
 */

export type AnalyticsPath = 'record' | 'fake';
export type AnalyticsSurface = 'landing' | 'analyze' | 'report' | 'share';
export type AnalyticsTheme = 'dark' | 'light';
export type Viewport = 'mobile' | 'tablet' | 'desktop' | 'unknown';

export interface EventMap {
  // — Landing —
  landing_view: Record<string, never>;
  landing_cta_click: { cta: 'analyze' | 'fake' };

  // — Analyze flow —
  analyze_view: {
    initialStep: 'intake' | 'capture' | 'analysis';
    pathParam: AnalyticsPath | null;
  };
  intake_path_selected: { path: AnalyticsPath };
  capture_started: Record<string, never>;
  capture_completed: { elapsedMs: number; method: 'timer' | 'manual_stop' };
  capture_restarted: Record<string, never>;
  capture_cancelled: { phase: 'armed' | 'recording' };
  analysis_started: { path: AnalyticsPath | null; variantId: string | null };
  analysis_completed: { variantId: string; elapsedMs: number };

  // — Report —
  report_view: { variantId: string };
  variant_switched: {
    surface: Extract<AnalyticsSurface, 'report' | 'share'>;
    from: string;
    to: string;
    method: 'switcher' | 'generate_another';
  };
  caption_copied: {
    surface: Extract<AnalyticsSurface, 'report' | 'share'>;
    variantId: string;
    /** Index of the caption inside `variant.captions`; 0 = featured. */
    captionIndex: number;
  };
  generate_another_clicked: {
    surface: Extract<AnalyticsSurface, 'report' | 'share'>;
    variantId: string;
  };
  save_share_card_clicked: { variantId: string };

  // — Share —
  share_view: { variantId: string };
  share_download_started: { variantId: string };
  share_download_succeeded: {
    variantId: string;
    fileName: string;
    width: number;
    height: number;
    latencyMs: number;
  };
  share_download_failed: {
    variantId: string;
    reason: string;
    latencyMs: number;
  };
  open_full_dossier_clicked: { variantId: string };

  // — Challenge loop —
  /** Fires when the user issues a challenge from /report or /share. */
  challenge_link_created: {
    challengeId: string;
    variantId: string;
    score: number;
    challengeType: 'beat_score' | 'rarer_classification' | 'open';
    sourceSurface: Extract<AnalyticsSurface, 'report' | 'share'>;
  };
  /** Fires once per /challenge page view. */
  challenge_link_opened: {
    challengeId: string;
    variantId: string;
    score: number;
    challengeType: 'beat_score' | 'rarer_classification' | 'open';
    sourceSurface: Extract<AnalyticsSurface, 'report' | 'share'>;
    perspective: 'sender' | 'recipient';
    hasValidParams: boolean;
  };
  challenge_cta_clicked: {
    cta: 'accept' | 'fake' | 'back_to_lab' | 'copy_link';
    challengeId: string;
    variantId: string;
    perspective: 'sender' | 'recipient';
  };
  /** Fires when /analyze→/report carries a challenge context through the funnel. */
  challenge_context_forwarded: {
    challengeId: string;
    sourceVariantId: string;
    sourceScore: number;
    /** Where the user is going next. */
    targetSurface: Extract<AnalyticsSurface, 'analyze' | 'report'>;
  };

  // — Native sponsorship (ceremonial inventory) —
  sponsored_inventory_served: {
    surface: 'methane_index' | 'challenge' | 'wrapped' | 'sponsor_lab';
    slots: string[];
    placementIds: string[];
  };
  sponsored_inventory_clicked: {
    surface: 'methane_index' | 'wrapped' | 'challenge';
    slotCode: string;
    placementId: string;
  };
  sponsored_badge_issued: {
    wrappedCycleId: string;
    badgeId: string;
    placementId: string;
  };
  sponsored_challenge_opened: {
    challengeId: string;
    variantId: string;
    placementId: string;
  };
  campaign_preview_rendered: {
    surface: 'sponsor_lab';
    mode?: string;
  };

  sponsor_lab_view: Record<string, never>;

  // — Public gallery readiness (server-originated events; client may mirror for lab previews) —
  gallery_submission_created: {
    reportId: string;
    submissionId: string;
    resubmission?: boolean;
    screeningPipeline?: number;
  };
  gallery_submission_approved: { submissionId: string };
  gallery_submission_rejected: { submissionId: string; reasonCode?: string };
  gallery_report_filed: { submissionId: string; reasonCode: string };
  gallery_item_removed: { submissionId: string; reasonCode?: string };
  gallery_item_featured: { submissionId: string; featuredRank: number };
  moderation_lab_view: Record<string, never>;

  fulfillment_lab_view: Record<string, never>;
  /** Internal plans + entitlements lab (operator-only). */
  plans_lab_view: Record<string, never>;
  commerce_order_created: {
    intentId?: string;
    fulfillmentOrderId?: string;
    surface?: 'fulfillment_lab';
  };
  fulfillment_submitted: { fulfillmentOrderId?: string; providerOrderRef?: string };
  fulfillment_failed: { fulfillmentOrderId?: string };
  fulfillment_shipped: { fulfillmentOrderId?: string };
  merch_asset_packaged: { intentId?: string; lineCount?: number };

  // — Premium upsell —
  /** Fires once per /premium page view. */
  premium_view: {
    variantId: string;
    sourceSurface: 'report' | 'share' | 'challenge' | 'direct';
  };
  /** Fires once per offer the user actually sees rendered above the fold. */
  premium_offer_viewed: {
    offerId: string;
    offerType: 'pdf_certificate' | 'wall_certificate' | 'theme_pack' | 'roast_mode';
    variantId: string;
    /** 0-indexed position in the offer grid. */
    position: number;
    reportId?: string;
    surface?: 'report' | 'wrapped' | 'creator';
  };
  /** Generic "the user clicked a premium-related CTA somewhere". */
  premium_cta_clicked: {
    variantId: string;
    /** Where the click happened. */
    location:
      | 'report_action_row'
      | 'share_actions'
      | 'premium_header'
      | 'premium_footer'
      | 'offer_card';
    sourceSurface: 'report' | 'share' | 'premium';
  };
  /** Fires when the user picks a specific offer's primary CTA. */
  premium_offer_selected: {
    offerId: string;
    offerType: 'pdf_certificate' | 'wall_certificate' | 'theme_pack' | 'roast_mode';
    variantId: string;
  };
  /** Hover / click into a preview artifact. */
  premium_preview_interacted: {
    variantId: string;
    previewType: 'pdf_certificate' | 'wall_certificate' | 'theme_pack';
  };
  /** Returns the user to /report from /premium. */
  premium_back_to_report_clicked: { variantId: string };

  /** Bureau artifact-commerce: user locks a premium theme on a real report. */
  premium_theme_selected: {
    commerceThemeCode: string;
    intentId?: string;
    reportId: string;
    surface: 'report' | 'wrapped' | 'creator';
  };
  certificate_previewed: {
    intentId: string;
    certificateKind: 'official_pdf' | 'wall_print';
    reportId: string;
  };
  checkout_started: { intentId: string; reportId: string };
  checkout_completed: { intentId: string; reportId: string };
  artifact_fulfilled: { intentId: string; reportId: string };

  // — Launch / pre-launch shell —
  /** Fires once per launch-shell mount (on `/` when LAUNCH_MODE is on, or `/launch`). */
  launch_view: {
    /** Which route is rendering the shell. */
    surface: 'home' | 'launch';
    /** Whether the homepage is in launch mode at the time. */
    mode: 'launch' | 'live';
    /** True if the visitor has already filed a waitlist request locally. */
    hasPriorSubmission: boolean;
  };
  /** Fires whenever a "Request early access / Join waitlist" CTA is clicked. */
  waitlist_cta_clicked: {
    location:
      | 'hero_primary'
      | 'hero_secondary'
      | 'panel_focus'
      | 'bulletin'
      | 'press_strip';
  };
  /** Fires the moment the user submits the form (intent, pre-persistence). */
  early_access_requested: {
    hasName: boolean;
    hasEmail: boolean;
    hasFartName: boolean;
  };
  /** Fires after a submission is successfully stored locally. */
  waitlist_submitted: {
    /** The deterministic founder number assigned. */
    founderNumber: string;
    /** Same payload as `early_access_requested` for analytics joins. */
    hasName: boolean;
    hasEmail: boolean;
    hasFartName: boolean;
  };
  /** Fires when the user opens the sample dossier from the launch shell. */
  sample_report_opened: {
    variantId: string;
    location: 'hero_secondary' | 'sample_preview';
  };
  /** Fires when the user hovers / focuses / clicks the founding badge. */
  founding_badge_interacted: {
    kind: 'hover' | 'click';
    /** True if a founder number has been assigned (post-submit). */
    hasFounderNumber: boolean;
  };
  /** Fires once per launch-shell mount when the regulatory notice is in DOM. */
  release_notice_viewed: {
    filingNumber: string;
    releaseStatus: string;
  };

  // — Press / embargo kit —
  /** Fires once per /press page view. */
  press_view: Record<string, never>;
  /** Fires when a press exhibit is opened (live link) or its reference is copied. */
  press_asset_opened: {
    assetId: string;
    assetType: 'dossier' | 'share_card' | 'challenge_notice' | 'premium_certificate';
    method: 'click' | 'copy_ref';
  };
  /** Fires when a boilerplate quote is copied to the clipboard. */
  press_quote_copied: {
    quoteId: string;
    role: string;
  };
  /** Fires for hover / copy interactions on the media fact sheet. */
  press_fact_sheet_interacted: {
    factId: string;
    kind: 'hover' | 'copy';
  };
  /** Fires when any of the press contact CTAs is clicked. */
  press_contact_clicked: {
    contactType: 'press_desk' | 'media_email' | 'media_phone' | 'archive_request';
  };
  /** Fires once per /press page view when the embargo notice is rendered. */
  embargo_notice_viewed: {
    embargoIso: string;
    docket: string;
  };

  // — Creator seeding tool —
  /** Fires once per /seed page view. */
  seed_tool_view: Record<string, never>;
  /** Fires when the operator changes target name, type, or platform. */
  seed_target_configured: {
    targetType: 'creator' | 'brand' | 'meme_account' | 'custom';
    hasLabel: boolean;
    platform: 'none' | 'tiktok' | 'x' | 'instagram' | 'reddit' | 'discord';
  };
  /** Fires when the operator tunes a variant-level override. */
  seed_variant_adjusted: {
    variantId: string;
    field: 'classification' | 'score' | 'threat' | 'caption';
  };
  /** Fires when the operator toggles an output surface on. */
  seed_output_selected: {
    surface: 'report' | 'share' | 'challenge' | 'premium';
    enabled: boolean;
  };
  /** Fires whenever a seed link is freshly composed (debounced upstream). */
  seed_link_generated: {
    surface: 'report' | 'share' | 'challenge' | 'premium';
    variantId: string;
    hasOverrides: boolean;
  };
  /** Fires when the operator copies a generated URL or pitch caption. */
  seed_link_copied: {
    surface: 'report' | 'share' | 'challenge' | 'premium';
    kind: 'url' | 'pitch';
  };
  /** Fires when the operator opens the seed preview (live link). */
  seed_preview_opened: {
    surface: 'report' | 'share' | 'challenge' | 'premium';
    variantId: string;
  };

  // — National Methane Index / public bulletin —
  /** Fires once per /methane-index page view. */
  methane_index_view: {
    issueId: string;
    issueNumber: string;
  };
  /** Fires when the bulletin is backed by persisted filings (live or low-volume). */
  methane_index_realdata_view: {
    issueId: string;
    issueNumber: string;
    provenance: 'live' | 'low_volume';
    windowLabel?: string;
  };
  /** Fires when the backend selects a featured dossier for the weekly bulletin. */
  featured_artifact_selected: {
    issueId: string;
    variantId: string;
    reportId?: string;
  };
  /** Fires when an operator opens the underlying dossier from a movers row. */
  classification_row_opened: {
    issueId: string;
    classificationId: string;
    rank: number;
    variantId: string;
  };
  /** Fires when the featured artifact is opened (dossier or share). */
  featured_artifact_opened: {
    issueId: string;
    variantId: string;
    surface: 'report' | 'share';
  };
  /** Fires when a ritual teaser is clicked. */
  ritual_teaser_interacted: {
    issueId: string;
    ritualId: string;
    kind: 'click' | 'hover';
  };
  /** Fires once when the commentary block is rendered. */
  commentary_section_viewed: {
    issueId: string;
    lineCount: number;
  };

  // — Fart Wrapped (annual review ritual) —
  /** Fires once per /fart-wrapped page view. */
  fart_wrapped_view: {
    wrappedCycleId: string;
    /** True if the page was rendered with seed-style overrides applied. */
    hasOverrides: boolean;
  };
  /** Fires when wrapped payload is query-backed (session or slug). */
  wrapped_realdata_view: {
    wrappedCycleId: string;
    provenance: 'live' | 'low_volume';
    source: 'session' | 'slug';
  };
  /** Fires when wrapped is compiled from session filings. */
  wrapped_generated_from_session: {
    wrappedCycleId: string;
    reportCount: number;
    cohortYear: number;
  };
  /** Fires when a story panel is interacted with (open dossier / hover). */
  wrapped_story_panel_viewed: {
    wrappedCycleId: string;
    panelId: string;
    /** Optional underlying dossier the panel references. */
    variantId?: string;
    kind: 'open' | 'hover';
  };
  /** Fires when one of the distinction badges is interacted with. */
  wrapped_badge_interacted: {
    wrappedCycleId: string;
    badgeId: string;
    kind: 'click' | 'hover';
  };
  /** Fires when the user opens the share-poster's "Save share card" link. */
  wrapped_share_opened: {
    wrappedCycleId: string;
    variantId: string;
  };
  /** Fires when the share poster's summary line is copied. */
  wrapped_poster_copied: {
    wrappedCycleId: string;
    kind: 'summary' | 'closing';
  };
  /** Fires when the breakdown row's underlying classification is opened. */
  wrapped_classification_opened: {
    wrappedCycleId: string;
    classification: string;
    variantId: string;
  };

  // — Internal ops console (instrumentation only) —
  ops_view: { hours: number };
  ops_window_changed: { fromHours: number; toHours: number };
  ops_variant_drilldown_opened: { variantKey: string };

  // — Creator / Discord community tooling (server may also emit these) —
  discord_command_invoked: {
    command: string;
    guildId?: string;
    channelId?: string;
  };
  community_artifact_issued: { kind: string; templateId?: string; challengeId?: string };
  ritual_bulletin_posted: { ritual: string; provenance?: string };
  creator_tool_used: { tool: string };
  badge_issued: { templateId: string; honoreeLine?: string };
  /** Internal lab only — operator preview of Discord-style endpoints. */
  creator_tools_lab_invoked: { command: string; ok: boolean; status?: number };

  // — Environment / one-shot —
  reduced_motion_detected: { value: boolean };
  theme_toggled: { from: AnalyticsTheme; to: AnalyticsTheme };
}

export type EventName = keyof EventMap;
export type PayloadFor<E extends EventName> = EventMap[E];
