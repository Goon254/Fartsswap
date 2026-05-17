 
import * as Sentry from '@sentry/node';

/**
 * Sentry-style error reporting.
 *
 * Gated by `SENTRY_DSN`. When unset, all SDK calls are no-ops, so the rest of
 * the code can call `captureException` unconditionally.
 *
 * Initialise as early as possible (before AppModule) so unhandled errors
 * during bootstrap are also captured.
 */
export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    return;
  }
  const tracesSampleRate = Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1');
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: Number.isFinite(tracesSampleRate) ? tracesSampleRate : 0.1,
    // We attach release via env at deploy time; leave undefined for now.
  });
  console.log(`[sentry] initialised env=${process.env.NODE_ENV ?? 'development'}`);
}

export function captureException(error: unknown, context?: Record<string, unknown>): void {
  if (!process.env.SENTRY_DSN) return;
  Sentry.captureException(error, context ? { extra: context } : undefined);
}

export async function flushSentry(timeoutMs = 2000): Promise<void> {
  if (!process.env.SENTRY_DSN) return;
  try {
    await Sentry.flush(timeoutMs);
  } catch (error) {
    console.warn('[sentry] flush failed', error);
  }
}
