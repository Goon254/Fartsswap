import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AnalyticsEvent } from '../../../../shared/domain/models';
import type { AnalyticsEventRepository } from '../../application/ports/analytics-event.repository';
import { AnalyticsEventEntity } from './analytics-event.entity';

@Injectable()
export class TypeOrmAnalyticsEventRepository implements AnalyticsEventRepository {
  constructor(
    @InjectRepository(AnalyticsEventEntity)
    private readonly repo: Repository<AnalyticsEventEntity>,
  ) {}

  async save(event: AnalyticsEvent): Promise<void> {
    const entity = new AnalyticsEventEntity();
    entity.id = event.id;
    entity.sessionId = event.sessionId;
    entity.reportId = event.reportId;
    entity.eventType = event.eventType;
    entity.payload = event.payload;
    entity.clientEventId = event.clientEventId;
    entity.ingestSource = event.ingestSource ?? 'server';
    entity.createdAt = new Date(event.createdAt);
    await this.repo.save(entity);
  }
}
