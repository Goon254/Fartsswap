import type { ReportArtifact } from '../../../../shared/domain/models';
import type { ArtifactType } from '../../../../shared/domain/types';

export interface ReportArtifactRepository {
  save(artifact: ReportArtifact): Promise<void>;
  update(artifact: ReportArtifact): Promise<void>;
  findById(id: string): Promise<ReportArtifact | null>;
  findByReportId(reportId: string, type?: ArtifactType): Promise<ReportArtifact[]>;
  /**
   * Look up a ready artifact for (reportId, type, themeCode). Used by the PDF
   * use case to return an existing artifact instead of regenerating when
   * called multiple times with the same theme.
   */
  findReadyByReportTypeTheme(
    reportId: string,
    type: ArtifactType,
    themeCode: string,
  ): Promise<ReportArtifact | null>;
}

export const REPORT_ARTIFACT_REPOSITORY = Symbol('REPORT_ARTIFACT_REPOSITORY');
