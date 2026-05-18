import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdentityModule } from '../identity/identity.module';
import { IngestClientAnalyticsUseCase } from './application/ingest-client-analytics.use-case';
import { ANALYTICS_EVENT_REPOSITORY } from './application/ports/analytics-event.repository';
import { TrackAnalyticsEventUseCase } from './application/track-analytics-event.use-case';
import { AnalyticsEventEntity } from './infrastructure/persistence/analytics-event.entity';
import { TypeOrmAnalyticsEventRepository } from './infrastructure/persistence/typeorm-analytics-event.repository';
import { AnalyticsIngestController } from './interface/http/analytics-ingest.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AnalyticsEventEntity]), IdentityModule],
  controllers: [AnalyticsIngestController],
  providers: [
    { provide: ANALYTICS_EVENT_REPOSITORY, useClass: TypeOrmAnalyticsEventRepository },
    TrackAnalyticsEventUseCase,
    IngestClientAnalyticsUseCase,
  ],
  exports: [TrackAnalyticsEventUseCase],
})
export class AnalyticsModule {}
