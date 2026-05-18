import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigModule } from '../../config/config.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { IdentityModule } from '../identity/identity.module';
import { SponsorshipAttributionService } from './application/sponsorship-attribution.service';
import { SponsorshipCampaignAdminService } from './application/sponsorship-campaign-admin.service';
import { SponsorshipResolveService } from './application/sponsorship-resolve.service';
import { SponsorshipAttributionEntity } from './infrastructure/persistence/sponsorship-attribution.entity';
import { SponsorshipCampaignEntity } from './infrastructure/persistence/sponsorship-campaign.entity';
import { SponsorshipPlacementEntity } from './infrastructure/persistence/sponsorship-placement.entity';
import { SponsorshipOpsController } from './interface/http/sponsorship-ops.controller';
import { SponsorshipPublicController } from './interface/http/sponsorship-public.controller';
import { OpsKeyGuard } from '../ops/interface/http/ops-key.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SponsorshipCampaignEntity,
      SponsorshipPlacementEntity,
      SponsorshipAttributionEntity,
    ]),
    AppConfigModule,
    AnalyticsModule,
    IdentityModule,
  ],
  controllers: [SponsorshipPublicController, SponsorshipOpsController],
  providers: [
    OpsKeyGuard,
    SponsorshipResolveService,
    SponsorshipAttributionService,
    SponsorshipCampaignAdminService,
  ],
  exports: [SponsorshipResolveService],
})
export class SponsorshipsModule {}
