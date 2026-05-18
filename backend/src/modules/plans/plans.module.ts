import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigModule } from '../../config/config.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { OpsKeyGuard } from '../ops/interface/http/ops-key.guard';
import { CreatorPlansAdminService } from './application/creator-plans-admin.service';
import { EntitlementResolutionService } from './application/entitlement-resolution.service';
import { SUBSCRIPTION_BILLING_PORT } from './application/ports/subscription-billing.port';
import { MockSubscriptionBillingAdapter } from './infrastructure/billing/mock-subscription-billing.adapter';
import { BillingCustomerEntity } from './infrastructure/persistence/billing-customer.entity';
import { BillingLifecycleEventEntity } from './infrastructure/persistence/billing-lifecycle-event.entity';
import { CreatorSubscriptionPlanFeatureEntity } from './infrastructure/persistence/creator-subscription-plan-feature.entity';
import { CreatorSubscriptionPlanEntity } from './infrastructure/persistence/creator-subscription-plan.entity';
import { CreatorSubscriptionUsagePeriodEntity } from './infrastructure/persistence/creator-subscription-usage-period.entity';
import { CreatorSubscriptionEntity } from './infrastructure/persistence/creator-subscription.entity';
import { PlansOpsController } from './interface/http/plans-ops.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CreatorSubscriptionPlanEntity,
      CreatorSubscriptionPlanFeatureEntity,
      CreatorSubscriptionEntity,
      CreatorSubscriptionUsagePeriodEntity,
      BillingCustomerEntity,
      BillingLifecycleEventEntity,
    ]),
    AppConfigModule,
    AnalyticsModule,
  ],
  controllers: [PlansOpsController],
  providers: [
    MockSubscriptionBillingAdapter,
    { provide: SUBSCRIPTION_BILLING_PORT, useExisting: MockSubscriptionBillingAdapter },
    EntitlementResolutionService,
    CreatorPlansAdminService,
    OpsKeyGuard,
  ],
  exports: [EntitlementResolutionService, CreatorPlansAdminService],
})
export class PlansModule {}
