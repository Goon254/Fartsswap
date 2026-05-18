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

  // — Environment / one-shot —
  reduced_motion_detected: { value: boolean };
  theme_toggled: { from: AnalyticsTheme; to: AnalyticsTheme };
}

export type EventName = keyof EventMap;
export type PayloadFor<E extends EventName> = EventMap[E];
