import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  DATABASE_HOST: z.string().min(1),
  DATABASE_PORT: z.coerce.number().int().positive().default(5432),
  DATABASE_USER: z.string().min(1),
  DATABASE_PASSWORD: z.string(),
  DATABASE_NAME: z.string().min(1),
  DATABASE_SSL: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  DATABASE_RUN_MIGRATIONS: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),

  REDIS_HOST: z.string().min(1).default('localhost'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  STORAGE_PROVIDER: z.enum(['local', 's3']).default('local'),
  STORAGE_LOCAL_PATH: z.string().default('./.storage'),
  STORAGE_BUCKET: z.string().default('farts-artifacts'),
  STORAGE_ENDPOINT: z.string().optional(),
  STORAGE_REGION: z.string().default('us-east-1'),
  STORAGE_ACCESS_KEY: z.string().optional(),
  STORAGE_SECRET_KEY: z.string().optional(),

  QUEUE_PROVIDER: z.enum(['memory', 'redis']).default('memory'),

  AI_PROVIDER: z.enum(['stub', 'openai', 'disabled']).default('disabled'),
  AI_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  AI_API_KEY: z.string().optional(),
  AI_BASE_URL: z.string().default('https://api.openai.com/v1'),
  AI_MODEL: z.string().default('gpt-4o-mini'),
  AI_TIMEOUT_MS: z.coerce.number().int().positive().default(8_000),
  AI_MAX_TOKENS: z.coerce.number().int().positive().default(400),
  AI_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.9),
  AI_MAX_RETRIES: z.coerce.number().int().min(0).max(5).default(1),
  AI_DEBUG_LOG: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),

  // --- AI usage caps (Redis-backed, per-day) ---
  AI_DAILY_SESSION_LIMIT: z.coerce.number().int().min(0).default(50),
  AI_DAILY_IP_LIMIT: z.coerce.number().int().min(0).default(200),

  SESSION_COOKIE_NAME: z.string().default('farts_session'),
  SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(2_592_000),
  SESSION_COOKIE_SECRET: z.string().min(32).optional(),

  AUDIO_UPLOAD_MAX_BYTES: z.coerce.number().int().positive().default(1_048_576),
  AUDIO_UPLOAD_ALLOWED_MIME_TYPES: z
    .string()
    .default('audio/webm,audio/ogg,audio/mpeg'),
  AUDIO_UPLOAD_STORAGE_PREFIX: z.string().default('audio/raw'),
  AUDIO_AUTO_DELETE_AFTER_PROCESSING: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),

  CORS_ALLOWED_ORIGINS: z.string().default('*'),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().default(60),
  REQUEST_BODY_LIMIT_BYTES: z.coerce.number().int().positive().default(131_072),

  IDEMPOTENCY_TTL_SECONDS: z.coerce.number().int().positive().default(86_400),

  // --- Observability ---
  METRICS_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  METRICS_PATH: z.string().default('/metrics'),
  OTEL_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  OTEL_SERVICE_NAME: z.string().default('farts-backend'),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0.1),

  // --- Graceful shutdown ---
  SHUTDOWN_GRACE_SECONDS: z.coerce.number().int().min(0).default(15),

  // --- Outbox dispatcher (worker) ---
  OUTBOX_POLL_INTERVAL_MS: z.coerce.number().int().min(50).default(1_000),
  OUTBOX_BATCH_SIZE: z.coerce.number().int().min(1).max(500).default(50),
  OUTBOX_MAX_ATTEMPTS: z.coerce.number().int().min(1).default(10),

  // --- Audio retention worker ---
  AUDIO_RETENTION_MAX_AGE_HOURS: z.coerce.number().int().min(0).default(24),
  AUDIO_RETENTION_SWEEP_INTERVAL_MS: z.coerce.number().int().min(1_000).default(60_000),

  // --- App role ---
  // 'api' (default): serve HTTP. 'worker': run background dispatchers only.
  APP_ROLE: z.enum(['api', 'worker', 'all']).default('all'),

  /** Shared secret for internal ops/mission-control API (`x-ops-key` header). */
  OPS_CONSOLE_SECRET: z.string().optional(),

  /**
   * Optional dedicated secret for creator / Discord-tooling API (`x-creator-tools-key`).
   * When unset, `OPS_CONSOLE_SECRET` is accepted for the same header (single key mode).
   */
  CREATOR_TOOLS_SECRET: z.string().optional(),

  /** Public site origin for absolute URLs in bot payloads (no trailing slash). */
  FARTS_PUBLIC_ORIGIN: z.string().optional(),

  /** Community / server label embedded in creator payloads and analytics. */
  CREATOR_COMMUNITY_LABEL: z.string().optional(),
  /** Bulletin channel flavour key (cosmetic; drives copy variants later). */
  CREATOR_BULLETIN_STYLE: z.string().optional(),
  /** Tone preset label for generator hints (cosmetic metadata). */
  CREATOR_TONE_PACK: z.string().optional(),
  /** Comma-separated command ids enabled for tooling (default: all). */
  CREATOR_ENABLED_COMMANDS: z.string().optional(),

  /** When false, POST /gallery/submissions returns 403 (infrastructure can ship dark). */
  GALLERY_SUBMISSIONS_ENABLED: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
  /** When false, GET /gallery/feed returns { enabled: false, items: [] }. */
  GALLERY_PUBLIC_FEED_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),

  /** When true, checkout-complete creates POD order rows + mock provider submit. */
  POD_FULFILLMENT_ENABLED: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  /** mock: call MockPodProvider; disabled: persist order + package but skip provider. */
  POD_PROVIDER_MODE: z.enum(['mock', 'disabled']).default('mock'),
  /** Optional shared secret for POST /fulfillment/webhooks/mock (header x-pod-webhook-secret). */
  POD_WEBHOOK_SECRET: z.string().optional(),

  /**
   * When true, creator plan features (e.g. batch_generation) require an active test subscription.
   * Core single-shot classify stays free; enforcement applies to batch_size > 1 only.
   */
  CREATOR_ENTITLEMENT_ENFORCEMENT: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
})
.superRefine((env, ctx) => {
  if (env.NODE_ENV === 'production' && !env.SESSION_COOKIE_SECRET) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['SESSION_COOKIE_SECRET'],
      message:
        'SESSION_COOKIE_SECRET is required in production (>= 32 chars) to sign anonymous session cookies',
    });
  }
  if (env.NODE_ENV === 'production' && (!env.OPS_CONSOLE_SECRET || env.OPS_CONSOLE_SECRET.trim().length < 16)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['OPS_CONSOLE_SECRET'],
      message:
        'OPS_CONSOLE_SECRET is required in production (min 16 chars) to protect internal ops dashboard API routes',
    });
  }
  if (env.STORAGE_PROVIDER === 's3') {
    const missing: string[] = [];
    if (!env.STORAGE_BUCKET) missing.push('STORAGE_BUCKET');
    if (!env.STORAGE_REGION) missing.push('STORAGE_REGION');
    // Access keys are optional in real S3 if IAM-role-based auth is used,
    // so we don't require them here — the SDK will pick up the environment
    // credential chain. We only require the bucket+region to address objects.
    if (missing.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['STORAGE_PROVIDER'],
        message: `STORAGE_PROVIDER=s3 requires: ${missing.join(', ')}`,
      });
    }
  }
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const formatted = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Environment validation failed:\n${formatted}`);
  }
  return result.data;
}
