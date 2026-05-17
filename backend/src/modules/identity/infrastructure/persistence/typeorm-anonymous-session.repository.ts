import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AnonymousSession } from '../../../../shared/domain/models';
import type { AnonymousSessionRepository } from '../../application/ports/anonymous-session.repository';
import { AnonymousSessionEntity } from './anonymous-session.entity';

@Injectable()
export class TypeOrmAnonymousSessionRepository implements AnonymousSessionRepository {
  constructor(
    @InjectRepository(AnonymousSessionEntity)
    private readonly repo: Repository<AnonymousSessionEntity>,
  ) {}

  async save(session: AnonymousSession): Promise<void> {
    await this.repo.save(this.toEntity(session));
  }

  async findById(id: string): Promise<AnonymousSession | null> {
    const row = await this.repo.findOne({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async touch(id: string, lastSeenAt: Date): Promise<void> {
    await this.repo.update({ id }, { lastSeenAt });
  }

  private toEntity(session: AnonymousSession): AnonymousSessionEntity {
    const entity = new AnonymousSessionEntity();
    entity.id = session.id;
    entity.createdAt = new Date(session.createdAt);
    entity.lastSeenAt = new Date(session.lastSeenAt);
    entity.expiresAt = new Date(session.expiresAt);
    entity.metadata = session.metadata;
    return entity;
  }

  private toDomain(entity: AnonymousSessionEntity): AnonymousSession {
    return {
      id: entity.id,
      createdAt: entity.createdAt.toISOString(),
      lastSeenAt: entity.lastSeenAt.toISOString(),
      expiresAt: entity.expiresAt.toISOString(),
      metadata: entity.metadata,
    };
  }
}
