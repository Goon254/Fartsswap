import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './interface/http/health.controller';
import { RedisHealthIndicator } from './infrastructure/health/redis.health-indicator';
import { StorageHealthIndicator } from './infrastructure/health/storage.health-indicator';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [RedisHealthIndicator, StorageHealthIndicator],
})
export class CoreModule {}
