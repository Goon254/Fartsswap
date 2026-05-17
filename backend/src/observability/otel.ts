/* eslint-disable @typescript-eslint/no-unsafe-assignment,
                   @typescript-eslint/no-unsafe-call,
                   @typescript-eslint/no-unsafe-member-access,
                   @typescript-eslint/no-require-imports */
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';

/**
 * OpenTelemetry bootstrap.
 *
 * Must be imported and `startOpenTelemetry()` called BEFORE any other module
 * (Nest, TypeORM, ioredis, fastify) so the auto-instrumentations can wrap
 * them at require-time.
 *
 * Gated by `OTEL_ENABLED=true`. When disabled, this is a no-op so the
 * dependency stays optional in dev and tests.
 *
 * Implementation note: the OTel packages are loaded via `require` here so
 * that disabling OTel completely skips loading them. This means TypeScript
 * can't type-check the surface — the eslint-disable above is intentional
 * and scoped to this single boundary file.
 */
export function startOpenTelemetry(): { shutdown: () => Promise<void> } {
  if (process.env['OTEL_ENABLED'] !== 'true') {
    return { shutdown: () => Promise.resolve() };
  }

  const { NodeSDK } = require('@opentelemetry/sdk-node');
  const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
  const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
  const { Resource } = require('@opentelemetry/resources');
  const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

  if (process.env['OTEL_DEBUG'] === 'true') {
    diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);
  }

  const serviceName = process.env['OTEL_SERVICE_NAME'] ?? 'farts-backend';
  const endpoint = process.env['OTEL_EXPORTER_OTLP_ENDPOINT'];

  const sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]:
        process.env['NODE_ENV'] ?? 'development',
    }),
    traceExporter: new OTLPTraceExporter(endpoint ? { url: `${endpoint}/v1/traces` } : {}),
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
        '@opentelemetry/instrumentation-dns': { enabled: false },
      }),
    ],
  });

  sdk.start();
  console.log(`[otel] started, service=${serviceName}${endpoint ? ` endpoint=${endpoint}` : ''}`);

  return {
    shutdown: async () => {
      try {
        await sdk.shutdown();
      } catch (error) {
        console.warn('[otel] shutdown error', error);
      }
    },
  };
}
