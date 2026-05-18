import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigModule } from '../../config/config.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { PremiumIntentEntity } from '../commerce/infrastructure/persistence/premium-intent.entity';
import { ReportsModule } from '../reports/reports.module';
import { OpsKeyGuard } from '../ops/interface/http/ops-key.guard';
import { FulfillmentCheckoutHandoffService } from './application/fulfillment-checkout-handoff.service';
import { POD_PROVIDER_PORT } from './application/ports/pod-provider.port';
import { PodFulfillmentOrchestrationService } from './application/pod-fulfillment-orchestration.service';
import { MockPodProviderAdapter } from './infrastructure/providers/mock-pod-provider.adapter';
import { PodFulfillmentEventEntity } from './infrastructure/persistence/pod-fulfillment-event.entity';
import { PodFulfillmentOrderItemEntity } from './infrastructure/persistence/pod-fulfillment-order-item.entity';
import { PodFulfillmentOrderEntity } from './infrastructure/persistence/pod-fulfillment-order.entity';
import { FulfillmentOpsController } from './interface/http/fulfillment-ops.controller';
import { FulfillmentWebhookController } from './interface/http/fulfillment-webhook.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PodFulfillmentOrderEntity,
      PodFulfillmentOrderItemEntity,
      PodFulfillmentEventEntity,
      PremiumIntentEntity,
    ]),
    AppConfigModule,
    AnalyticsModule,
    ReportsModule,
  ],
  controllers: [FulfillmentWebhookController, FulfillmentOpsController],
  providers: [
    MockPodProviderAdapter,
    { provide: POD_PROVIDER_PORT, useExisting: MockPodProviderAdapter },
    PodFulfillmentOrchestrationService,
    FulfillmentCheckoutHandoffService,
    OpsKeyGuard,
  ],
  exports: [FulfillmentCheckoutHandoffService],
})
export class FulfillmentModule {}
