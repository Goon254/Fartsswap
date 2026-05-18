// IMPORTANT: OpenTelemetry must be initialised before anything else loads so
// auto-instrumentations can patch fastify/typeorm/ioredis/pg at require-time.
// Sentry is initialised next so even early bootstrap errors are captured.
import { startOpenTelemetry } from './observability/otel';
const otel = startOpenTelemetry();
import { captureException, flushSentry, initSentry } from './observability/sentry';
initSentry();

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import fastifyCookie from '@fastify/cookie';
import fastifyMultipart from '@fastify/multipart';
import fastifyHelmet from '@fastify/helmet';
import fastifyCors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';
import { Logger as PinoLogger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { AppConfigService } from './config/config.service';
import { runMigrations } from './database/run-migrations';
import { AllExceptionsFilter } from './modules/core/interface/http/filters/all-exceptions.filter';
import { RequestContextInterceptor } from './modules/core/interface/http/interceptors/request-context.interceptor';

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false,
      bodyLimit: Number(process.env.REQUEST_BODY_LIMIT_BYTES ?? 131_072),
      trustProxy: process.env.NODE_ENV === 'production',
    }),
    { bufferLogs: true },
  );

  const config = app.get(AppConfigService);

  if (config.database.runMigrations) {
    logger.log('Running database migrations...');
    await runMigrations();
  }

  // Helmet — strict in prod, relaxed in dev so Swagger UI works.
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: config.isProduction ? undefined : false,
    crossOriginEmbedderPolicy: false,
  });

  const corsCfg = config.cors;
  await app.register(fastifyCors, {
    origin: corsCfg.allowAll
      ? true
      : (origin, cb) => {
          if (!origin || corsCfg.allowedOrigins.includes(origin)) {
            cb(null, true);
            return;
          }
          cb(new Error('Origin not allowed by CORS'), false);
        },
    credentials: true,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Idempotency-Key', 'x-ops-key', 'x-creator-tools-key'],
    exposedHeaders: ['Idempotency-Key', 'Idempotent-Replayed'],
  });

  await app.register(fastifyRateLimit, {
    global: true,
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.windowSeconds * 1000,
    allowList: (req) => req.url === '/health' || req.url === '/ready' || req.url === '/metrics',
    errorResponseBuilder: (_req, ctx) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Retry after ${Math.ceil(ctx.ttl / 1000)}s.`,
      retryAfter: Math.ceil(ctx.ttl / 1000),
    }),
  });

  await app.register(fastifyCookie, {
    secret: config.session.cookieSecret,
  });

  await app.register(fastifyMultipart, {
    limits: {
      fileSize: config.audioUpload.maxBytes,
      files: 1,
      fields: 8,
      fieldSize: 1024,
    },
  });

  app.useLogger(app.get(PinoLogger));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new RequestContextInterceptor());

  // Enable Nest shutdown hooks so OnApplicationShutdown providers
  // (outbox dispatcher, retention sweeper, Redis client) get a chance to
  // drain on SIGTERM/SIGINT.
  app.enableShutdownHooks();

  if (!config.isProduction || process.env.ENABLE_SWAGGER === 'true') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Farts.com API')
      .setDescription('Backend API — reports, artifacts, and audio upload')
      .setVersion('0.1.0')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document);
  }

  const port = config.port;
  await app.listen(port, '0.0.0.0');

  logger.log(`Farts.com backend listening on http://localhost:${port}`);
  logger.log(`Environment: ${config.nodeEnv} role=${config.appRole}`);
  if (!config.isProduction || process.env.ENABLE_SWAGGER === 'true') {
    logger.log(`OpenAPI docs at http://localhost:${port}/docs`);
  }
  if (config.observability.metricsEnabled) {
    logger.log(`Prometheus metrics at http://localhost:${port}${config.observability.metricsPath}`);
  }

  installGracefulShutdown(app, config.shutdownGraceSeconds);
}

/**
 * Two-stage graceful shutdown:
 *   1. Stop accepting new HTTP requests (Fastify close()).
 *   2. Run Nest shutdown hooks (drain timers, close DB/Redis clients).
 *   3. Flush Sentry + OpenTelemetry exporters.
 *
 * SIGTERM is what K8s sends; SIGINT is local Ctrl-C. Both should be clean.
 */
function installGracefulShutdown(app: NestFastifyApplication, graceSeconds: number): void {
  const logger = new Logger('Shutdown');
  let shuttingDown = false;
  const shutdown = (signal: string): void => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.log(`Received ${signal}, draining (grace=${graceSeconds}s)...`);
    const hardStop = setTimeout(() => {
      logger.error('Graceful shutdown timed out, exiting');
      process.exit(1);
    }, graceSeconds * 1000);
    hardStop.unref();

    void (async () => {
      try {
        await app.close();
        await otel.shutdown();
        await flushSentry();
        logger.log('Shutdown complete');
        process.exit(0);
      } catch (error) {
        captureException(error);
        logger.error({ err: error }, 'shutdown failed');
        process.exit(1);
      }
    })();
  };
  process.on('SIGTERM', () => { shutdown('SIGTERM'); });
  process.on('SIGINT', () => { shutdown('SIGINT'); });

  // Unhandled error capture — log + report rather than crash silently.
  process.on('unhandledRejection', (reason) => {
    logger.error({ err: reason }, 'unhandledRejection');
    captureException(reason);
  });
  process.on('uncaughtException', (error) => {
    logger.error({ err: error }, 'uncaughtException');
    captureException(error);
  });
}

bootstrap().catch((error: unknown) => {
   
  console.error('Failed to start application', error);
  captureException(error);
  void flushSentry().finally(() => process.exit(1));
});
