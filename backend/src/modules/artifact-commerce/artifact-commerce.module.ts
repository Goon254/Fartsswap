import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigModule } from '../../config/config.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { ArtifactsModule } from '../artifacts/artifacts.module';
import { PremiumIntentEntity } from '../commerce/infrastructure/persistence/premium-intent.entity';
import { IdentityModule } from '../identity/identity.module';
import { ReportsModule } from '../reports/reports.module';
import { FulfillmentModule } from '../fulfillment/fulfillment.module';
import { ArtifactCommerceIntentService } from './application/artifact-commerce-intent.service';
import { ArtifactCommerceController } from './interface/http/artifact-commerce.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([PremiumIntentEntity]),
    AppConfigModule,
    ReportsModule,
    ArtifactsModule,
    AnalyticsModule,
    IdentityModule,
    FulfillmentModule,
  ],
  controllers: [ArtifactCommerceController],
  providers: [ArtifactCommerceIntentService],
})
export class ArtifactCommerceModule {}
