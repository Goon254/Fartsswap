import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ANALYTICS_EVENT_REPOSITORY } from './application/ports/analytics-event.repository';
import { TrackAnalyticsEventUseCase } from './application/track-analytics-event.use-case';
import { AnalyticsEventEntity } from './infrastructure/persistence/analytics-event.entity';
import { TypeOrmAnalyticsEventRepository } from './infrastructure/persistence/typeorm-analytics-event.repository';

@Module({
  imports: [TypeOrmModule.forFeature([AnalyticsEventEntity])],
  providers: [
    { provide: ANALYTICS_EVENT_REPOSITORY, useClass: TypeOrmAnalyticsEventRepository },
    TrackAnalyticsEventUseCase,
  ],
  exports: [TrackAnalyticsEventUseCase],
})
export class AnalyticsModule {}
