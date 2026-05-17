import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { AppConfigService } from '../../../config/config.service';
import { MetricsService } from '../../../observability/metrics.service';
import { captureException } from '../../../observability/sentry';
import {
  AI_PROVIDER_PORT,
  type AiProviderPort,
} from '../../../shared/application/ports/ai-provider.port';
import { AnalyticsEventType } from '../../../shared/domain/types';
import { TrackAnalyticsEventUseCase } from '../../analytics/application/track-analytics-event.use-case';
import {
  generateFakeReportFields,
  type FakeReportFields,
} from '../../reports/domain/fake-report-generator';
import type { AiReportRequest, AiReportResult } from '../domain/ai-report.types';
import {
  AI_QUOTA_PORT,
  type AiQuotaPort,
  type QuotaCheckRequest,
  type QuotaDecision,
} from './ports/ai-quota.port';
import {
  AiOutputParseError,
  buildFallbackFields,
  normaliseModelOutput,
  parseModelOutput,
} from './output-validator';
import { buildPrompt } from './prompt-builder';

/**
 * The single entry-point for "give me a report".
 *
 * Behaviour:
 *  1. Always compute the deterministic fallback (cheap, sync). Used as both
 *     the per-field default during normalisation and the full fallback when
 *     anything in the AI path fails.
 *  2. If the provider is not callable (AI disabled / no key / stub), return
 *     the fallback immediately with `fallbackUsed=true` and a clear reason.
 *  3. Otherwise: build prompt → call provider → parse → sanitise → return.
 *     Any error along the way is logged + reported and the fallback is
 *     returned instead. The user request NEVER fails because of AI issues.
 *  4. Always emits analytics: `ai.report_requested` on entry and exactly
 *     one of `ai.report_succeeded` / `ai.report_failed` on exit. Prompts
 *     and raw responses are never included in analytics payloads.
 */
@Injectable()
export class AiReportOrchestrator {
  private readonly logger = new Logger(AiReportOrchestrator.name);

  constructor(
    @Inject(AI_PROVIDER_PORT) private readonly provider: AiProviderPort,
    @Inject(AI_QUOTA_PORT) private readonly quota: AiQuotaPort,
    private readonly config: AppConfigService,
    private readonly trackEvent: TrackAnalyticsEventUseCase,
    @Optional() private readonly metrics?: MetricsService,
  ) {}

  async generate(request: AiReportRequest): Promise<AiReportResult> {
    const startedAt = Date.now();
    const fallback = this.computeFallback(request);
    const fallbackResult = (reason: string, latencyMs: number): AiReportResult => ({
      fields: buildFallbackFields(request, fallback),
      meta: {
        source: 'fallback',
        provider: 'deterministic',
        model: 'fallback',
        latencyMs,
        fallbackUsed: true,
        fallbackReason: reason,
      },
    });

    this.metrics?.aiReportsAttemptedTotal.inc({ source: request.source });

    await this.trackEvent.trackBestEffort({
      eventType: AnalyticsEventType.AI_REPORT_REQUESTED,
      payload: {
        source: request.source,
        provider: this.provider.id,
        model: this.provider.model,
        callable: this.provider.isCallable,
      },
    });

    if (!this.provider.isCallable) {
      const result = fallbackResult('provider_not_callable', Date.now() - startedAt);
      await this.recordOutcome(request, result);
      return result;
    }

    // Quota enforcement: every attempt counts, including fallback. If either
    // the per-session OR the per-IP daily cap is exceeded we skip the provider
    // call entirely and short-circuit to the deterministic generator with
    // reason=quota_exceeded.
    const quota = await this.checkQuota(request);
    if (quota.exceeded) {
      this.metrics?.aiReportsQuotaExceededTotal.inc({ scope: quota.scope });
      const result = fallbackResult(`quota_exceeded:${quota.scope}`, Date.now() - startedAt);
      await this.recordOutcome(request, result);
      return result;
    }

    const prompt = buildPrompt(request);
    try {
      const cfg = this.config.ai;
      const completion = await this.provider.complete({
        systemPrompt: prompt.system,
        userPrompt: prompt.user,
        maxTokens: cfg.maxTokens,
        temperature: cfg.temperature,
        timeoutMs: cfg.timeoutMs,
      });
      const parsed = parseModelOutput(completion.text);
      const fields = normaliseModelOutput(parsed, request, fallback);
      const latencyMs = Date.now() - startedAt;
      const result: AiReportResult = {
        fields,
        meta: {
          source: 'model',
          provider: completion.provider,
          model: completion.model,
          latencyMs,
          fallbackUsed: false,
        },
      };
      await this.recordOutcome(request, result);
      return result;
    } catch (error) {
      const latencyMs = Date.now() - startedAt;
      const reason = classifyError(error);
      this.logger.warn(
        {
          err: error instanceof Error ? error.message : 'unknown',
          source: request.source,
          provider: this.provider.id,
          model: this.provider.model,
          reason,
          latencyMs,
        },
        'ai report orchestration failed; using deterministic fallback',
      );
      captureException(error, { stage: 'ai.report_orchestrator', reason });
      const result = fallbackResult(reason, latencyMs);
      await this.recordOutcome(request, result);
      return result;
    }
  }

  private computeFallback(request: AiReportRequest): FakeReportFields {
    return generateFakeReportFields({
      ...(request.customFartName !== undefined ? { customFartName: request.customFartName } : {}),
      ...(request.tonePreset !== undefined ? { tonePreset: request.tonePreset } : {}),
      seed: request.seed,
    });
  }

  private async recordOutcome(
    request: AiReportRequest,
    result: AiReportResult,
  ): Promise<void> {
    const event = result.meta.fallbackUsed
      ? AnalyticsEventType.AI_REPORT_FAILED
      : AnalyticsEventType.AI_REPORT_SUCCEEDED;

    await this.trackEvent.trackBestEffort({
      eventType: event,
      payload: {
        source: request.source,
        provider: result.meta.provider,
        model: result.meta.model,
        latencyMs: result.meta.latencyMs,
        fallbackUsed: result.meta.fallbackUsed,
        ...(result.meta.fallbackReason ? { reason: result.meta.fallbackReason } : {}),
      },
    });
  }

  /**
   * Consume daily quota for whichever identifiers are available on the
   * request. Both per-session and per-IP are checked when present; we return
   * the first scope that's over its limit (session > ip priority — session
   * is the tighter, more-relevant cap to surface for "lab closed").
   *
   * A limit of `0` is treated as "unlimited / disabled" so operators can
   * temporarily turn one scope off without code changes.
   */
  private async checkQuota(
    request: AiReportRequest,
  ): Promise<{ exceeded: false } | { exceeded: true; scope: 'session' | 'ip' }> {
    const { dailySessionLimit, dailyIpLimit } = this.config.ai;
    const checks: QuotaCheckRequest[] = [];
    if (request.sessionId && dailySessionLimit > 0) {
      checks.push({ scope: 'session', identifier: request.sessionId, limit: dailySessionLimit });
    }
    if (request.ipAddress && dailyIpLimit > 0) {
      checks.push({ scope: 'ip', identifier: request.ipAddress, limit: dailyIpLimit });
    }
    if (checks.length === 0) return { exceeded: false };

    let decisions: QuotaDecision[];
    try {
      decisions = await this.quota.consume(checks);
    } catch (error) {
      // Fail-open: a Redis hiccup must not break user requests. Log + carry on.
      this.logger.warn({ err: error }, 'ai quota check failed; allowing request');
      return { exceeded: false };
    }
    const exceededSession = decisions.find((d) => d.scope === 'session' && d.exceeded);
    if (exceededSession) return { exceeded: true, scope: 'session' };
    const exceededIp = decisions.find((d) => d.scope === 'ip' && d.exceeded);
    if (exceededIp) return { exceeded: true, scope: 'ip' };
    return { exceeded: false };
  }
}

function classifyError(error: unknown): string {
  if (error instanceof AiOutputParseError) return `parse_${error.reason}`;
  if (error instanceof Error) {
    if (error.name === 'AiTimeoutError') return 'timeout';
    if (error.name === 'AiHttpError') return 'provider_http_error';
    if (error.message.toLowerCase().includes('abort')) return 'timeout';
  }
  return 'provider_error';
}
