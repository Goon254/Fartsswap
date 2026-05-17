import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsModule } from '../analytics/analytics.module';
import { IdentityModule } from '../identity/identity.module';
import { ReportsModule } from '../reports/reports.module';
import { REPORT_ARTIFACT_REPOSITORY } from './application/ports/report-artifact.repository';
import { SHARE_CARD_RENDERER_PORT } from './application/ports/share-card-renderer.port';
import { GenerateShareCardArtifactUseCase } from './application/generate-share-card-artifact.use-case';
import { GetArtifactContentUseCase } from './application/get-artifact-content.use-case';
import { GetArtifactUseCase } from './application/get-artifact.use-case';
import { ListReportArtifactsUseCase } from './application/list-report-artifacts.use-case';
import { ShareCardArtifactGenerator } from './application/share-card-artifact.generator';
import { ReportArtifactEntity } from './infrastructure/persistence/report-artifact.entity';
import { ShareLinkEntity } from './infrastructure/persistence/share-link.entity';
import { TypeOrmReportArtifactRepository } from './infrastructure/persistence/typeorm-report-artifact.repository';
import { HtmlShareCardRendererAdapter } from './infrastructure/rendering/html-share-card-renderer.adapter';
import { ArtifactsController } from './interface/http/artifacts.controller';
import { ReportArtifactsController } from './interface/http/report-artifacts.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReportArtifactEntity, ShareLinkEntity]),
    ReportsModule,
    IdentityModule,
    AnalyticsModule,
  ],
  controllers: [ReportArtifactsController, ArtifactsController],
  providers: [
    { provide: REPORT_ARTIFACT_REPOSITORY, useClass: TypeOrmReportArtifactRepository },
    { provide: SHARE_CARD_RENDERER_PORT, useClass: HtmlShareCardRendererAdapter },
    ShareCardArtifactGenerator,
    GenerateShareCardArtifactUseCase,
    ListReportArtifactsUseCase,
    GetArtifactUseCase,
    GetArtifactContentUseCase,
  ],
  exports: [GenerateShareCardArtifactUseCase, ListReportArtifactsUseCase, GetArtifactUseCase],
})
export class ArtifactsModule {}
