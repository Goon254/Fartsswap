/** Mirrors `GET /api/v1/ops/dashboard` JSON (internal contract). */

export interface OpsDashboardWindow {
  hours: number;
  sinceIso: string;
  untilIso: string;
  previousSinceIso: string;
}

export interface OpsDashboardMeta {
  nodeEnv: string;
  databaseOk: boolean;
  generatedAtIso: string;
}

export interface OpsKpis {
  reportsTotal: number;
  reportsInWindow: number;
  reportsPreviousWindow: number;
  shareLinksInWindow: number;
  shareLinksPreviousWindow: number;
  shareViewsInWindow: number;
  shareDownloadsSucceededInWindow: number;
  challengeLinksInWindow: number;
  challengeOpensInWindow: number;
  challengeResolvedInWindow: number;
  premiumIntentsInWindow: number;
  sessionsDistinctOnReportsInWindow: number;
  sessionsCreatedInWindow: number;
  avgReportsPerActiveSession: number;
  repeatReportSessionsInWindow: number;
  shareRatePerReport: number | null;
  challengeRatePerReport: number | null;
  premiumIntentRatePerReport: number | null;
  screenshotSuccessRatePerReport: number | null;
}

export interface OpsFunnelStep {
  id: string;
  label: string;
  count: number;
}

export interface OpsVariantRow {
  variantKey: string;
  reportGenerations: number;
  shareViews: number;
  shareDownloadsSucceeded: number;
  challengeLinks: number;
  premiumIntents: number;
  shareRate: number | null;
  challengeRate: number | null;
  premiumRate: number | null;
  screenshotRate: number | null;
}

export interface OpsLedgerRow {
  kind: string;
  occurredAtIso: string;
  ref: string;
  summary: string;
}

export interface OpsDashboardPayload {
  window: OpsDashboardWindow;
  meta: OpsDashboardMeta;
  kpis: OpsKpis;
  funnel: OpsFunnelStep[];
  variants: OpsVariantRow[];
  ledger: OpsLedgerRow[];
}
