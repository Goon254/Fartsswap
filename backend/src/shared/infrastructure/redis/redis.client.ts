import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis, { type RedisOptions } from 'ioredis';
import { AppConfigService } from '../../../config/config.service';

/**
 * Shared ioredis client.
 *
 * Lazy-connects on first use so the application boots without Redis when
 * `QUEUE_PROVIDER=memory` and no Redis-backed feature is active. Reused by
 * the rate limiter and idempotency cache.
 */
@Injectable()
export class RedisClient implements OnModuleDestroy {
  private readonly logger = new Logger(RedisClient.name);
  private client: Redis | undefined;
  private connectAttempted = false;

  constructor(private readonly config: AppConfigService) {}

  /**
   * Return the connected client, lazily constructing it on first call.
   * Returns `undefined` if Redis is not configured / unreachable; callers
   * should fall back gracefully.
   */
  get(): Redis | undefined {
    if (this.client) return this.client;
    if (this.connectAttempted) return undefined;
    this.connectAttempted = true;
    try {
      const { host, port, password } = this.config.redis;
      const opts: RedisOptions = {
        host,
        port,
        lazyConnect: false,
        maxRetriesPerRequest: 2,
        enableOfflineQueue: false,
      };
      if (password) opts.password = password;
      // Upstash (and other hosted Redis) require TLS on port 6379.
      if (host.includes('upstash.io')) {
        opts.tls = {};
      }
      this.client = new Redis(opts);
      this.client.on('error', (err: Error) => {
        this.logger.warn({ err: err.message }, 'redis client error');
      });
    } catch (error) {
      this.logger.warn({ err: error }, 'redis client construction failed');
      this.client = undefined;
    }
    return this.client;
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
      } catch {
        this.client.disconnect();
      }
    }
  }
}
