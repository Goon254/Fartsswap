import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigModule } from '../../config/config.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { IdentityModule } from '../identity/identity.module';
import { AudioModule } from '../audio/audio.module';
import { ReportsModule } from '../reports/reports.module';
import { ReportArtifactEntity } from '../artifacts/infrastructure/persistence/report-artifact.entity';
import { OpsKeyGuard } from '../ops/interface/http/ops-key.guard';
import { GalleryApplicationService } from './application/gallery-application.service';
import { GalleryDecisionLogEntity } from './infrastructure/persistence/gallery-decision-log.entity';
import { GalleryItemReportEntity } from './infrastructure/persistence/gallery-item-report.entity';
import { GallerySessionBlockEntity } from './infrastructure/persistence/gallery-session-block.entity';
import { GallerySubmissionEntity } from './infrastructure/persistence/gallery-submission.entity';
import { GalleryOpsController } from './interface/http/gallery-ops.controller';
import { GalleryPublicController } from './interface/http/gallery-public.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GallerySubmissionEntity,
      GalleryDecisionLogEntity,
      GalleryItemReportEntity,
      GallerySessionBlockEntity,
      ReportArtifactEntity,
    ]),
    AppConfigModule,
    AnalyticsModule,
    IdentityModule,
    AudioModule,
    ReportsModule,
  ],
  controllers: [GalleryPublicController, GalleryOpsController],
  providers: [GalleryApplicationService, OpsKeyGuard],
  exports: [GalleryApplicationService],
})
export class GalleryModule {}
