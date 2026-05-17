import type { Report, ReportInput } from '../../../../shared/domain/models';

export interface ReportRepository {
  saveReport(report: Report): Promise<void>;
  saveReportInput(input: ReportInput): Promise<void>;
  findReportById(id: string): Promise<Report | null>;
}

export const REPORT_REPOSITORY = Symbol('REPORT_REPOSITORY');
