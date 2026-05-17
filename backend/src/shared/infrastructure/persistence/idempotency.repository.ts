import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { IdempotencyKeyEntity } from './idempotency-key.entity';

export interface IdempotencyRecord {
  storageKey: string;
  scope: string;
  clientKey: string;
  sessionId?: string;
  requestHash: string;
  responseStatus: number;
  responseBody: unknown;
  responseHeaders?: Record<string, string>;
  createdAt: Date;
  expiresAt: Date;
}

@Injectable()
export class IdempotencyRepository {
  constructor(
    @InjectRepository(IdempotencyKeyEntity)
    private readonly repo: Repository<IdempotencyKeyEntity>,
  ) {}

  async findActive(storageKey: string, now: Date): Promise<IdempotencyRecord | null> {
    const row = await this.repo.findOne({ where: { storageKey } });
    if (!row) return null;
    if (row.expiresAt.getTime() <= now.getTime()) {
      // Lazy GC: best-effort delete; ignore failures.
      void this.repo.delete({ storageKey }).catch(() => undefined);
      return null;
    }
    return this.toDomain(row);
  }

  async insert(record: IdempotencyRecord): Promise<void> {
    // ON CONFLICT DO NOTHING so concurrent retries don't fight each other.
    await this.repo
      .createQueryBuilder()
      .insert()
      .into(IdempotencyKeyEntity)
      .values({
        storageKey: record.storageKey,
        scope: record.scope,
        clientKey: record.clientKey,
        sessionId: record.sessionId,
        requestHash: record.requestHash,
        responseStatus: record.responseStatus,
        responseBody: record.responseBody as object,
        responseHeaders: record.responseHeaders,
        createdAt: record.createdAt,
        expiresAt: record.expiresAt,
      })
      .orIgnore()
      .execute();
  }

  async deleteExpired(now: Date): Promise<number> {
    const result = await this.repo.delete({ expiresAt: LessThan(now) });
    return result.affected ?? 0;
  }

  private toDomain(entity: IdempotencyKeyEntity): IdempotencyRecord {
    return {
      storageKey: entity.storageKey,
      scope: entity.scope,
      clientKey: entity.clientKey,
      sessionId: entity.sessionId,
      requestHash: entity.requestHash,
      responseStatus: entity.responseStatus,
      responseBody: entity.responseBody,
      responseHeaders: entity.responseHeaders,
      createdAt: entity.createdAt,
      expiresAt: entity.expiresAt,
    };
  }
}
