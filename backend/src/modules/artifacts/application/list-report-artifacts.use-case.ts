import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ReportArtifact } from '../../../shared/domain/models';
import { REPORT_REPOSITORY, type ReportRepository } from '../../reports/application/ports/report.repository';
import {
  REPORT_ARTIFACT_REPOSITORY,
  type ReportArtifactRepository,
} from './ports/report-artifact.repository';

@Injectable()
export class ListReportArtifactsUseCase {
  constructor(
    @Inject(REPORT_REPOSITORY) private readonly reports: ReportRepository,
    @Inject(REPORT_ARTIFACT_REPOSITORY) private readonly artifacts: ReportArtifactRepository,
  ) {}

  async execute(reportId: string): Promise<ReportArtifact[]> {
    const report = await this.reports.findReportById(reportId);
    if (!report) {
      throw new NotFoundException(`Report ${reportId} not found`);
    }
    return this.artifacts.findByReportId(reportId);
  }
}
