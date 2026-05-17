import { Module } from '@nestjs/common';
import { ObservabilityModule } from '../../observability/observability.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AiReportOrchestrator } from './application/ai-report.orchestrator';

/**
 * AI report orchestration module.
 *
 * Provider adapter bindings live in `SharedModule` (so they're globally
 * available behind `AI_PROVIDER_PORT`), but the orchestrator itself plus
 * its analytics/metrics dependencies are scoped here. Importers
 * (`ReportsModule`) re-export `AiReportOrchestrator` for use cases.
 */
@Module({
  imports: [AnalyticsModule, ObservabilityModule],
  providers: [AiReportOrchestrator],
  exports: [AiReportOrchestrator],
})
export class AiModule {}
