import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, LessThanOrEqual, Repository } from 'typeorm';
import { CLOCK_PORT, type ClockPort } from '../../application/ports/clock.port';
import { ID_GENERATOR_PORT, type IdGeneratorPort } from '../../application/ports/id-generator.port';
import type { OutboxEventInput, OutboxPort } from '../../application/ports/outbox.port';
import { AnalyticsOutboxEntity } from '../persistence/outbox.entity';
import { getTransactionalManager } from '../transaction/transaction-context';

@Injectable()
export class TypeOrmOutboxAdapter implements OutboxPort {
  constructor(
    @InjectRepository(AnalyticsOutboxEntity)
    private readonly repo: Repository<AnalyticsOutboxEntity>,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
    @Inject(ID_GENERATOR_PORT) private readonly ids: IdGeneratorPort,
  ) {}

  private get currentRepo(): Repository<AnalyticsOutboxEntity> {
    const tx = getTransactionalManager();
    return tx ? tx.getRepository(AnalyticsOutboxEntity) : this.repo;
  }

  async enqueue(event: OutboxEventInput): Promise<void> {
    const entity = new AnalyticsOutboxEntity();
    entity.id = this.ids.generate();
    entity.aggregateType = event.aggregateType;
    if (event.aggregateId !== undefined) {
      entity.aggregateId = event.aggregateId;
    }
    entity.eventType = event.eventType;
    entity.payload = event.payload;
    entity.attempts = 0;
    const now = this.clock.now();
    entity.nextAttemptAt = now;
    entity.createdAt = now;
    await this.currentRepo.save(entity);
  }

  async claimBatch(limit: number, now: Date): Promise<AnalyticsOutboxEntity[]> {
    return this.repo.find({
      where: { dispatchedAt: IsNull(), nextAttemptAt: LessThanOrEqual(now) },
      order: { nextAttemptAt: 'ASC' },
      take: limit,
    });
  }

  async markDispatched(id: string, dispatchedAt: Date): Promise<void> {
    await this.repo.update({ id }, { dispatchedAt });
  }

  async markFailed(
    id: string,
    attempts: number,
    nextAttemptAt: Date,
    lastError: string,
  ): Promise<void> {
    await this.repo.update({ id }, { attempts, nextAttemptAt, lastError });
  }

  async countPending(now: Date): Promise<number> {
    return this.repo.count({
      where: { dispatchedAt: IsNull(), nextAttemptAt: LessThanOrEqual(now) },
    });
  }
}
