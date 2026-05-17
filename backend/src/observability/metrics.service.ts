import { Injectable, OnModuleInit } from '@nestjs/common';
import { collectDefaultMetrics, Counter, Gauge, Histogram, Registry } from 'prom-client';

/**
 * Central Prometheus registry.
 *
 * Default Node.js metrics (event-loop lag, GC, RSS, heap, fds) are auto-collected.
 * Business counters/histograms are declared here and incremented from use cases
 * + interceptors so dashboards can chart real product activity.
 */
@Injectable()
export class MetricsService implements OnModuleInit {
  readonly registry = new Registry();

  readonly httpRequestsTotal = new Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests handled, by method+route+status_code',
    labelNames: ['method', 'route', 'status_code'] as const,
    registers: [this.registry],
  });

  readonly httpRequestDurationSeconds = new Histogram({
    name: 'http_request_duration_seconds',
    help: 'HTTP request duration in seconds, by method+route+status_code',
    labelNames: ['method', 'route', 'status_code'] as const,
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    registers: [this.registry],
  });

  readonly reportsCreatedTotal = new Counter({
    name: 'reports_created_total',
    help: 'Reports successfully created, by source',
    labelNames: ['source'] as const,
    registers: [this.registry],
  });

  readonly audioUploadsTotal = new Counter({
    name: 'audio_uploads_total',
    help: 'Audio uploads processed, by outcome',
    labelNames: ['outcome'] as const, // accepted | rejected_size | rejected_mime | rejected_bytes
    registers: [this.registry],
  });

  readonly artifactsGeneratedTotal = new Counter({
    name: 'artifacts_generated_total',
    help: 'Artifacts generated, by type+outcome',
    labelNames: ['type', 'outcome'] as const,
    registers: [this.registry],
  });

  readonly idempotencyReplayTotal = new Counter({
    name: 'idempotency_replay_total',
    help: 'Idempotency-Key replays, by scope+outcome',
    labelNames: ['scope', 'outcome'] as const, // hit | conflict | miss
    registers: [this.registry],
  });

  readonly outboxPendingGauge = new Gauge({
    name: 'outbox_pending_events',
    help: 'Number of pending outbox events awaiting dispatch',
    registers: [this.registry],
  });

  readonly outboxDispatchedTotal = new Counter({
    name: 'outbox_dispatched_total',
    help: 'Outbox events dispatched, by outcome',
    labelNames: ['outcome'] as const, // ok | failed | dead_letter
    registers: [this.registry],
  });

  readonly audioRetentionDeletedTotal = new Counter({
    name: 'audio_retention_deleted_total',
    help: 'Audio uploads deleted by the retention sweeper',
    registers: [this.registry],
  });

  readonly aiReportsAttemptedTotal = new Counter({
    name: 'ai_reports_attempted_total',
    help: 'AI report orchestrations attempted, by source',
    labelNames: ['source'] as const,
    registers: [this.registry],
  });

  readonly aiReportsQuotaExceededTotal = new Counter({
    name: 'ai_reports_quota_exceeded_total',
    help: 'AI report calls short-circuited because a usage cap was hit',
    labelNames: ['scope'] as const, // 'session' | 'ip'
    registers: [this.registry],
  });

  readonly pdfArtifactsGeneratedTotal = new Counter({
    name: 'pdf_artifacts_generated_total',
    help: 'PDF report artifacts generated, by theme + outcome',
    labelNames: ['themeCode', 'outcome'] as const, // 'ok' | 'failed'
    registers: [this.registry],
  });

  readonly pdfArtifactGenerationSeconds = new Histogram({
    name: 'pdf_artifact_generation_seconds',
    help: 'Time spent rendering + storing a PDF report artifact, by theme',
    labelNames: ['themeCode'] as const,
    buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5],
    registers: [this.registry],
  });

  onModuleInit(): void {
    collectDefaultMetrics({ register: this.registry });
  }

  async snapshot(): Promise<string> {
    return this.registry.metrics();
  }

  contentType(): string {
    return this.registry.contentType;
  }
}
