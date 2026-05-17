import type { ReportArtifact } from '../../../../shared/domain/models';
import type { ArtifactType } from '../../../../shared/domain/types';

export interface ReportArtifactRepository {
  save(artifact: ReportArtifact): Promise<void>;
  update(artifact: ReportArtifact): Promise<void>;
  findById(id: string): Promise<ReportArtifact | null>;
  findByReportId(reportId: string, type?: ArtifactType): Promise<ReportArtifact[]>;
}

export const REPORT_ARTIFACT_REPOSITORY = Symbol('REPORT_ARTIFACT_REPOSITORY');
