import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import Redis from 'ioredis';
import { AppConfigService } from '../../../../config/config.service';

/**
 * Redis ping check, used by the readiness probe only when QUEUE_PROVIDER=redis.
 *
 * Uses a short-lived client with a tight timeout so a hung Redis can't pin
 * the entire readiness check. The client is destroyed after every probe
 * because readiness probes are infrequent and we don't want to leak a
 * connection per check.
 */
@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly config: AppConfigService) {
    super();
  }

  async pingCheck(key: string): Promise<HealthIndicatorResult> {
    const redis = new Redis({
      host: this.config.redis.host,
      port: this.config.redis.port,
      password: this.config.redis.password,
      connectTimeout: 1500,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableOfflineQueue: false,
    });
    try {
      await redis.connect();
      const reply = await redis.ping();
      if (reply !== 'PONG') {
        throw new Error(`Unexpected reply: ${String(reply)}`);
      }
      return this.getStatus(key, true);
    } catch (error) {
      throw new HealthCheckError(
        'Redis ping failed',
        this.getStatus(key, false, {
          message: error instanceof Error ? error.message : 'unknown',
        }),
      );
    } finally {
      try {
        redis.disconnect();
      } catch {
        // ignore
      }
    }
  }
}
