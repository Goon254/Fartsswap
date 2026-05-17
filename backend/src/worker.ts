// Worker entrypoint.
//
// Boots the Nest application without binding an HTTP server. Background
// services (`OutboxDispatcherService`, `AudioRetentionService`) start via
// their OnModuleInit hooks because APP_ROLE defaults to 'all'; force it to
// 'worker' in production deployments where you split api/worker pods.
//
// Usage:
//   APP_ROLE=worker node dist/worker.js
//
// Graceful shutdown drains in-flight ticks then closes DB/Redis clients.

import { startOpenTelemetry } from './observability/otel';
const otel = startOpenTelemetry();
import { captureException, flushSentry, initSentry } from './observability/sentry';
initSentry();

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppConfigService } from './config/config.service';
import { runMigrations } from './database/run-migrations';

async function bootstrapWorker(): Promise<void> {
  const logger = new Logger('Worker');

  // Force worker role unless caller explicitly set APP_ROLE=all (handy for
  // single-process dev where the same binary runs both).
  process.env.APP_ROLE ??= 'worker';

  const app = await NestFactory.createApplicationContext(AppModule, {
    bufferLogs: true,
  });

  const config = app.get(AppConfigService);
  if (config.database.runMigrations) {
    logger.log('Running database migrations...');
    await runMigrations();
  }

  app.enableShutdownHooks();
  logger.log(`Worker started (role=${config.appRole})`);

  let shuttingDown = false;
  const shutdown = (signal: string): void => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.log(`Received ${signal}, draining...`);
    const hardStop = setTimeout(() => {
      logger.error('Worker shutdown timed out, exiting');
      process.exit(1);
    }, config.shutdownGraceSeconds * 1000);
    hardStop.unref();
    void (async () => {
      try {
        await app.close();
        await otel.shutdown();
        await flushSentry();
        logger.log('Worker shutdown complete');
        process.exit(0);
      } catch (error) {
        captureException(error);
        logger.error({ err: error }, 'worker shutdown failed');
        process.exit(1);
      }
    })();
  };
  process.on('SIGTERM', () => { shutdown('SIGTERM'); });
  process.on('SIGINT', () => { shutdown('SIGINT'); });
}

bootstrapWorker().catch((error: unknown) => {
   
  console.error('Failed to start worker', error);
  captureException(error);
  void flushSentry().finally(() => process.exit(1));
});
