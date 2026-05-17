import { Module } from '@nestjs/common';
import { ObservabilityModule } from '../../observability/observability.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AiReportOrchestrator } from './application/ai-report.orchestrator';
import { AI_QUOTA_PORT } from './application/ports/ai-quota.port';
import { RedisAiQuotaAdapter } from './infrastructure/redis-ai-quota.adapter';

/**
 * AI report orchestration module.
 *
 * Provider adapter bindings live in `SharedModule` (so they're globally
 * available behind `AI_PROVIDER_PORT`). This module owns the orchestrator
 * and the quota adapter. Importers (`ReportsModule`) re-export
 * `AiReportOrchestrator` for use cases.
 *
 * `RedisClient` is provided by the global `IdempotencyModule`, so we don't
 * re-bind it here.
 */
@Module({
  imports: [AnalyticsModule, ObservabilityModule],
  providers: [
    RedisAiQuotaAdapter,
    { provide: AI_QUOTA_PORT, useExisting: RedisAiQuotaAdapter },
    AiReportOrchestrator,
  ],
  exports: [AiReportOrchestrator, AI_QUOTA_PORT],
})
export class AiModule {}
