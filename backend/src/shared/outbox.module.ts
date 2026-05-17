import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsModule } from '../modules/analytics/analytics.module';
import { ObservabilityModule } from '../observability/observability.module';
import { OUTBOX_PORT } from './application/ports/outbox.port';
import { OutboxDispatcherService } from './infrastructure/outbox/outbox-dispatcher.service';
import { TypeOrmOutboxAdapter } from './infrastructure/outbox/typeorm-outbox.repository';
import { AnalyticsOutboxEntity } from './infrastructure/persistence/outbox.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([AnalyticsOutboxEntity]),
    AnalyticsModule,
    ObservabilityModule,
  ],
  providers: [
    TypeOrmOutboxAdapter,
    { provide: OUTBOX_PORT, useExisting: TypeOrmOutboxAdapter },
    OutboxDispatcherService,
  ],
  exports: [OUTBOX_PORT, TypeOrmOutboxAdapter],
})
export class OutboxModule {}