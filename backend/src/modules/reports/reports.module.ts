import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ObservabilityModule } from '../../observability/observability.module';
import { AiModule } from '../ai/ai.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AudioModule } from '../audio/audio.module';
import { IdentityModule } from '../identity/identity.module';
import { REPORT_REPOSITORY } from './application/ports/report.repository';
import { CreateReportFromAudioUseCase } from './application/create-report-from-audio.use-case';
import { GenerateFakeReportUseCase } from './application/generate-fake-report.use-case';
import { GetReportUseCase } from './application/get-report.use-case';
import { ReportEntity } from './infrastructure/persistence/report.entity';
import { ReportInputEntity } from './infrastructure/persistence/report-input.entity';
import { TypeOrmReportRepository } from './infrastructure/persistence/typeorm-report.repository';
import { ReportsController } from './interface/http/reports.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReportEntity, ReportInputEntity]),
    IdentityModule,
    AnalyticsModule,
    AudioModule,
    AiModule,
    ObservabilityModule,
  ],
  controllers: [ReportsController],
  providers: [
    { provide: REPORT_REPOSITORY, useClass: TypeOrmReportRepository },
    GenerateFakeReportUseCase,
    CreateReportFromAudioUseCase,
    GetReportUseCase,
  ],
  exports: [
    GenerateFakeReportUseCase,
    CreateReportFromAudioUseCase,
    GetReportUseCase,
    REPORT_REPOSITORY,
  ],
})
export class ReportsModule {}
