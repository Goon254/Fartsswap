import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  HealthIndicatorFunction,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { AppConfigService } from '../../../../config/config.service';
import { RedisHealthIndicator } from '../../infrastructure/health/redis.health-indicator';
import { StorageHealthIndicator } from '../../infrastructure/health/storage.health-indicator';

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly redis: RedisHealthIndicator,
    private readonly storage: StorageHealthIndicator,
    private readonly config: AppConfigService,
  ) {}

  /**
   * Liveness: process is up and the event loop is responsive. Intentionally
   * does NOT check downstream dependencies — a failing DB should not cause
   * the orchestrator to kill an otherwise-healthy process.
   */
  @Get('health')
  @ApiOperation({ summary: 'Liveness probe (no external dependencies)' })
  @ApiOkResponse({ description: 'Service process is alive' })
  liveness() {
    return {
      status: 'ok',
      uptimeSeconds: Math.round(process.uptime()),
      nodeEnv: this.config.nodeEnv,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Readiness: actually verifies every dependency this build will use.
   * Postgres always. Redis only when QUEUE_PROVIDER=redis. Storage always
   * (covers both the local adapter and any future real S3 adapter).
   */
  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe (verifies live dependencies)' })
  @ApiOkResponse({ description: 'Service is ready to accept traffic' })
  @HealthCheck()
  ready() {
    const checks: HealthIndicatorFunction[] = [
      () => this.db.pingCheck('database', { timeout: 1500 }),
      () => this.storage.pingCheck('storage'),
    ];
    if (this.config.queueProvider === 'redis') {
      checks.push(() => this.redis.pingCheck('redis'));
    }
    return this.health.check(checks);
  }
}
