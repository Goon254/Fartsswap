import { Global, Module } from '@nestjs/common';
import { AppConfigService } from '../config/config.service';
import { AI_PROVIDER_PORT } from './application/ports/ai-provider.port';
import { CLOCK_PORT } from './application/ports/clock.port';
import { ID_GENERATOR_PORT } from './application/ports/id-generator.port';
import { OBJECT_STORAGE_PORT } from './application/ports/object-storage.port';
import { QUEUE_PORT } from './application/ports/queue.port';
import { TRANSACTION_PORT } from './application/ports/transaction.port';
import { SystemClockAdapter } from './infrastructure/clock/system-clock.adapter';
import { UuidIdGeneratorAdapter } from './infrastructure/id/uuid-id-generator.adapter';
import { MemoryQueueAdapter } from './infrastructure/queue/memory-queue.adapter';
import { RedisQueueAdapter } from './infrastructure/queue/redis-queue.adapter';
import { LocalObjectStorageAdapter } from './infrastructure/storage/local-object-storage.adapter';
import { S3ObjectStorageAdapter } from './infrastructure/storage/s3-object-storage.adapter';
import { UnconfiguredS3ObjectStorageAdapter } from './infrastructure/storage/unconfigured-s3-object-storage.adapter';
import { TypeOrmTransactionAdapter } from './infrastructure/transaction/typeorm-transaction.adapter';
import { DisabledAiProviderAdapter } from '../modules/ai/infrastructure/disabled-ai-provider.adapter';
import { OpenAiProviderAdapter } from '../modules/ai/infrastructure/openai-ai-provider.adapter';
import { StubAiProviderAdapter } from '../modules/ai/infrastructure/stub-ai-provider.adapter';

@Global()
@Module({
  providers: [
    { provide: CLOCK_PORT, useClass: SystemClockAdapter },
    { provide: ID_GENERATOR_PORT, useClass: UuidIdGeneratorAdapter },
    {
      provide: QUEUE_PORT,
      useFactory: (config: AppConfigService, memory: MemoryQueueAdapter, redis: RedisQueueAdapter) =>
        config.queueProvider === 'redis' ? redis : memory,
      inject: [AppConfigService, MemoryQueueAdapter, RedisQueueAdapter],
    },
    MemoryQueueAdapter,
    RedisQueueAdapter,
    {
      provide: OBJECT_STORAGE_PORT,
      useFactory: (
        config: AppConfigService,
        local: LocalObjectStorageAdapter,
        s3: S3ObjectStorageAdapter,
        unconfigured: UnconfiguredS3ObjectStorageAdapter,
      ) => {
        if (config.storage.provider !== 's3') return local;
        // env.schema already enforces bucket+region for s3; the real adapter
        // throws on construction if the SDK can't be built. `unconfigured`
        // is retained only to satisfy DI for any module that still asks for
        // it explicitly.
        void unconfigured;
        return s3;
      },
      inject: [
        AppConfigService,
        LocalObjectStorageAdapter,
        S3ObjectStorageAdapter,
        UnconfiguredS3ObjectStorageAdapter,
      ],
    },
    LocalObjectStorageAdapter,
    S3ObjectStorageAdapter,
    UnconfiguredS3ObjectStorageAdapter,
    { provide: TRANSACTION_PORT, useClass: TypeOrmTransactionAdapter },
    StubAiProviderAdapter,
    DisabledAiProviderAdapter,
    OpenAiProviderAdapter,
    {
      provide: AI_PROVIDER_PORT,
      useFactory: (
        config: AppConfigService,
        openai: OpenAiProviderAdapter,
        stub: StubAiProviderAdapter,
        disabled: DisabledAiProviderAdapter,
      ) => {
        // Resolution order matches env semantics: AI_ENABLED=false short-circuits
        // to the disabled adapter, otherwise the requested AI_PROVIDER is used.
        if (!config.ai.enabled) return disabled;
        switch (config.ai.provider) {
          case 'openai':
            return openai;
          case 'stub':
            return stub;
          case 'disabled':
          default:
            return disabled;
        }
      },
      inject: [
        AppConfigService,
        OpenAiProviderAdapter,
        StubAiProviderAdapter,
        DisabledAiProviderAdapter,
      ],
    },
  ],
  exports: [
    CLOCK_PORT,
    ID_GENERATOR_PORT,
    QUEUE_PORT,
    OBJECT_STORAGE_PORT,
    TRANSACTION_PORT,
    AI_PROVIDER_PORT,
  ],
})
export class SharedModule {}
