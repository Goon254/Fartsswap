import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvConfig } from './env.schema';

@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService<EnvConfig, true>) {}

  get nodeEnv(): EnvConfig['NODE_ENV'] {
    return this.config.get('NODE_ENV', { infer: true });
  }

  get port(): number {
    return this.config.get('PORT', { infer: true });
  }

  get logLevel(): EnvConfig['LOG_LEVEL'] {
    return this.config.get('LOG_LEVEL', { infer: true });
  }

  get database() {
    return {
      host: this.config.get('DATABASE_HOST', { infer: true }),
      port: this.config.get('DATABASE_PORT', { infer: true }),
      username: this.config.get('DATABASE_USER', { infer: true }),
      password: this.config.get('DATABASE_PASSWORD', { infer: true }),
      database: this.config.get('DATABASE_NAME', { infer: true }),
      ssl: this.config.get('DATABASE_SSL', { infer: true }),
      runMigrations: this.config.get('DATABASE_RUN_MIGRATIONS', { infer: true }),
    };
  }

  get redis() {
    return {
      host: this.config.get('REDIS_HOST', { infer: true }),
      port: this.config.get('REDIS_PORT', { infer: true }),
      password: this.config.get('REDIS_PASSWORD', { infer: true }),
    };
  }

  get storage() {
    return {
      provider: this.config.get('STORAGE_PROVIDER', { infer: true }),
      localPath: this.config.get('STORAGE_LOCAL_PATH', { infer: true }),
      bucket: this.config.get('STORAGE_BUCKET', { infer: true }),
      endpoint: this.config.get('STORAGE_ENDPOINT', { infer: true }),
      region: this.config.get('STORAGE_REGION', { infer: true }),
      accessKey: this.config.get('STORAGE_ACCESS_KEY', { infer: true }),
      secretKey: this.config.get('STORAGE_SECRET_KEY', { infer: true }),
    };
  }

  get queueProvider(): EnvConfig['QUEUE_PROVIDER'] {
    return this.config.get('QUEUE_PROVIDER', { infer: true });
  }

  get aiProvider(): EnvConfig['AI_PROVIDER'] {
    return this.config.get('AI_PROVIDER', { infer: true });
  }

  get ai() {
    const enabled = this.config.get('AI_ENABLED', { infer: true });
    const apiKey = this.config.get('AI_API_KEY', { infer: true });
    const provider = this.aiProvider;
    return {
      enabled,
      provider,
      apiKey,
      baseUrl: this.config.get('AI_BASE_URL', { infer: true }),
      model: this.config.get('AI_MODEL', { infer: true }),
      timeoutMs: this.config.get('AI_TIMEOUT_MS', { infer: true }),
      maxTokens: this.config.get('AI_MAX_TOKENS', { infer: true }),
      temperature: this.config.get('AI_TEMPERATURE', { infer: true }),
      maxRetries: this.config.get('AI_MAX_RETRIES', { infer: true }),
      debugLog: this.config.get('AI_DEBUG_LOG', { infer: true }),
      /**
       * Whether the orchestrator should actually call a model. True only when
       * AI_ENABLED=true AND a real provider+key are configured. Anything else
       * (disabled flag, missing key, provider=disabled/stub) routes to the
       * deterministic fallback without making a network call.
       */
      callable:
        enabled &&
        provider !== 'disabled' &&
        provider !== 'stub' &&
        typeof apiKey === 'string' &&
        apiKey.length > 0,
    };
  }

  get session() {
    return {
      cookieName: this.config.get('SESSION_COOKIE_NAME', { infer: true }),
      ttlSeconds: this.config.get('SESSION_TTL_SECONDS', { infer: true }),
      cookieSecret:
        this.config.get('SESSION_COOKIE_SECRET', { infer: true }) ??
        // Dev-only fallback so local boot works without manual secret setup.
        // env.schema enforces a real secret in production.
        'farts-dev-only-cookie-secret-please-override-32chars',
    };
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get audioUpload() {
    const mimeTypes = this.config
      .get('AUDIO_UPLOAD_ALLOWED_MIME_TYPES', { infer: true })
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    return {
      maxBytes: this.config.get('AUDIO_UPLOAD_MAX_BYTES', { infer: true }),
      allowedMimeTypes: mimeTypes,
      storagePrefix: this.config.get('AUDIO_UPLOAD_STORAGE_PREFIX', { infer: true }),
      autoDeleteAfterProcessing: this.config.get(
        'AUDIO_AUTO_DELETE_AFTER_PROCESSING',
        { infer: true },
      ),
    };
  }

  get cors() {
    const raw = this.config.get('CORS_ALLOWED_ORIGINS', { infer: true });
    const origins = raw.split(',').map((o) => o.trim()).filter(Boolean);
    return {
      allowedOrigins: origins,
      allowAll: origins.length === 1 && origins[0] === '*',
    };
  }

  get rateLimit() {
    return {
      max: this.config.get('RATE_LIMIT_MAX', { infer: true }),
      windowSeconds: this.config.get('RATE_LIMIT_WINDOW_SECONDS', { infer: true }),
    };
  }

  get requestBodyLimitBytes(): number {
    return this.config.get('REQUEST_BODY_LIMIT_BYTES', { infer: true });
  }

  get idempotencyTtlSeconds(): number {
    return this.config.get('IDEMPOTENCY_TTL_SECONDS', { infer: true });
  }

  get observability() {
    return {
      metricsEnabled: this.config.get('METRICS_ENABLED', { infer: true }),
      metricsPath: this.config.get('METRICS_PATH', { infer: true }),
      otelEnabled: this.config.get('OTEL_ENABLED', { infer: true }),
      otelServiceName: this.config.get('OTEL_SERVICE_NAME', { infer: true }),
      otelEndpoint: this.config.get('OTEL_EXPORTER_OTLP_ENDPOINT', { infer: true }),
      sentryDsn: this.config.get('SENTRY_DSN', { infer: true }),
      sentryTracesSampleRate: this.config.get('SENTRY_TRACES_SAMPLE_RATE', { infer: true }),
    };
  }

  get shutdownGraceSeconds(): number {
    return this.config.get('SHUTDOWN_GRACE_SECONDS', { infer: true });
  }

  get outbox() {
    return {
      pollIntervalMs: this.config.get('OUTBOX_POLL_INTERVAL_MS', { infer: true }),
      batchSize: this.config.get('OUTBOX_BATCH_SIZE', { infer: true }),
      maxAttempts: this.config.get('OUTBOX_MAX_ATTEMPTS', { infer: true }),
    };
  }

  get audioRetention() {
    return {
      maxAgeHours: this.config.get('AUDIO_RETENTION_MAX_AGE_HOURS', { infer: true }),
      sweepIntervalMs: this.config.get('AUDIO_RETENTION_SWEEP_INTERVAL_MS', { infer: true }),
    };
  }

  get appRole(): 'api' | 'worker' | 'all' {
    return this.config.get('APP_ROLE', { infer: true });
  }

  get runsApi(): boolean {
    const role = this.appRole;
    return role === 'api' || role === 'all';
  }

  get runsWorker(): boolean {
    const role = this.appRole;
    return role === 'worker' || role === 'all';
  }
}
