import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdempotencyKeyEntity } from './infrastructure/persistence/idempotency-key.entity';
import { IdempotencyRepository } from './infrastructure/persistence/idempotency.repository';
import { RedisClient } from './infrastructure/redis/redis.client';
import { IdempotencyInterceptor } from './interface/http/idempotency.interceptor';
import { RateLimitInterceptor } from './interface/http/rate-limit.interceptor';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([IdempotencyKeyEntity])],
  providers: [
    IdempotencyRepository,
    RedisClient,
    { provide: APP_INTERCEPTOR, useClass: RateLimitInterceptor },
    { provide: APP_INTERCEPTOR, useClass: IdempotencyInterceptor },
  ],
  exports: [IdempotencyRepository, RedisClient],
})
export class IdempotencyModule {}
