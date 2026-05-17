/**
 * Daily AI usage quota check.
 *
 * The orchestrator calls `consume` for every report generation attempt
 * (model call OR deterministic fallback — both count as "AI usage" against
 * the daily cap so a flood of fallbacks can't burn the budget).
 *
 * Implementations are responsible for:
 *   - Atomically incrementing the counter for `(scope, identifier, day)`.
 *   - Returning whether the new value is over the configured limit.
 *   - Setting/extending the key's TTL to the end of the calendar day in UTC.
 *
 * The port returns a decision per scope so callers can attribute which limit
 * was hit (used for `ai_reports_quota_exceeded_total{scope}` and for the
 * analytics `reason` field).
 */

export type QuotaScope = 'session' | 'ip';

export interface QuotaDecision {
  scope: QuotaScope;
  identifier: string;
  /** Count AFTER this consumption. */
  count: number;
  limit: number;
  /** True when `count > limit`. */
  exceeded: boolean;
}

export interface QuotaCheckRequest {
  scope: QuotaScope;
  identifier: string;
  limit: number;
}

export interface AiQuotaPort {
  consume(checks: QuotaCheckRequest[]): Promise<QuotaDecision[]>;
}

export const AI_QUOTA_PORT = Symbol('AI_QUOTA_PORT');
