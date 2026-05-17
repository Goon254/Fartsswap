import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import type { QueueJobPayload, QueuePort } from '../../application/ports/queue.port';
import { AppConfigService } from '../../../config/config.service';

@Injectable()
export class RedisQueueAdapter implements QueuePort, OnModuleDestroy {
  private readonly queues = new Map<string, Queue>();

  constructor(private readonly config: AppConfigService) {}

  async enqueue<T extends QueueJobPayload>(queueName: string, payload: T): Promise<string> {
    const queue = this.getOrCreateQueue(queueName);
    const job = await queue.add(queueName, payload);
    return job.id ?? 'unknown';
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([...this.queues.values()].map((q) => q.close()));
  }

  private getOrCreateQueue(name: string): Queue {
    let queue = this.queues.get(name);
    if (!queue) {
      const { host, port, password } = this.config.redis;
      queue = new Queue(name, {
        connection: {
          host,
          port,
          password: password || undefined,
        },
      });
      this.queues.set(name, queue);
    }
    return queue;
  }
}
