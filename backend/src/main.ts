import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import fastifyCookie from '@fastify/cookie';
import fastifyMultipart from '@fastify/multipart';
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
    new FastifyAdapter({ logger: false }),
    { bufferLogs: true },
  );

  const config = app.get(AppConfigService);

  if (config.database.runMigrations) {
    logger.log('Running database migrations...');
    await runMigrations();
  }

  await app.register(fastifyCookie);
  await app.register(fastifyMultipart, {
    limits: {
      fileSize: config.audioUpload.maxBytes,
      files: 1,
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

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Farts.com API')
    .setDescription('Backend API — reports, artifacts, and audio upload')
    .setVersion('0.1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = config.port;
  await app.listen(port, '0.0.0.0');

  logger.log(`Farts.com backend listening on http://localhost:${port}`);
  logger.log(`OpenAPI docs at http://localhost:${port}/docs`);
  logger.log(`Environment: ${config.nodeEnv}`);
}

bootstrap().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start application', error);
  process.exit(1);
});
