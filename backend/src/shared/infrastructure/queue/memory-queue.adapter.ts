import { Injectable, Logger } from '@nestjs/common';
import type { QueueJobPayload, QueuePort } from '../../application/ports/queue.port';

@Injectable()
export class MemoryQueueAdapter implements QueuePort {
  private readonly logger = new Logger(MemoryQueueAdapter.name);

  async enqueue<T extends QueueJobPayload>(queueName: string, payload: T): Promise<string> {
    const jobId = `mem-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    this.logger.debug({ queueName, jobId, payload }, 'Enqueued in-memory job (no worker in Phase 1)');
    return jobId;
  }
}
