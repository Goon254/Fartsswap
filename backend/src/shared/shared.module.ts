import { Global, Module } from '@nestjs/common';
import { AppConfigService } from '../config/config.service';
import { AI_PROVIDER_PORT } from './application/ports/ai-provider.port';
import { CLOCK_PORT } from './application/ports/clock.port';
import { ID_GENERATOR_PORT } from './application/ports/id-generator.port';
import { OBJECT_STORAGE_PORT } from './application/ports/object-storage.port';
import { QUEUE_PORT } from './application/ports/queue.port';
import { SystemClockAdapter } from './infrastructure/clock/system-clock.adapter';
import { UuidIdGeneratorAdapter } from './infrastructure/id/uuid-id-generator.adapter';
import { MemoryQueueAdapter } from './infrastructure/queue/memory-queue.adapter';
import { RedisQueueAdapter } from './infrastructure/queue/redis-queue.adapter';
import { LocalObjectStorageAdapter } from './infrastructure/storage/local-object-storage.adapter';
import { StubS3ObjectStorageAdapter } from './infrastructure/storage/stub-s3-object-storage.adapter';
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
        s3: StubS3ObjectStorageAdapter,
      ) => (config.storage.provider === 's3' ? s3 : local),
      inject: [AppConfigService, LocalObjectStorageAdapter, StubS3ObjectStorageAdapter],
    },
    LocalObjectStorageAdapter,
    StubS3ObjectStorageAdapter,
    { provide: AI_PROVIDER_PORT, useClass: StubAiProviderAdapter },
  ],
  exports: [CLOCK_PORT, ID_GENERATOR_PORT, QUEUE_PORT, OBJECT_STORAGE_PORT, AI_PROVIDER_PORT],
})
export class SharedModule {}
