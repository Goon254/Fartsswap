import { Inject, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { AnalyticsEventType, ArtifactStatus } from '../../../shared/domain/types';
import { OBJECT_STORAGE_PORT, type ObjectStoragePort } from '../../../shared/application/ports/object-storage.port';
import { TrackAnalyticsEventUseCase } from '../../analytics/application/track-analytics-event.use-case';
import {
  REPORT_ARTIFACT_REPOSITORY,
  type ReportArtifactRepository,
} from './ports/report-artifact.repository';

export interface ArtifactContentResult {
  body: Buffer;
  contentType: string;
}

@Injectable()
export class GetArtifactContentUseCase {
  constructor(
    @Inject(REPORT_ARTIFACT_REPOSITORY) private readonly artifacts: ReportArtifactRepository,
    @Inject(OBJECT_STORAGE_PORT) private readonly storage: ObjectStoragePort,
    private readonly trackEvent: TrackAnalyticsEventUseCase,
  ) {}

  async execute(artifactId: string, sessionId?: string): Promise<ArtifactContentResult> {
    const artifact = await this.artifacts.findById(artifactId);
    if (!artifact) {
      throw new NotFoundException(`Artifact ${artifactId} not found`);
    }
    if (artifact.status !== ArtifactStatus.READY || !artifact.storageKey) {
      throw new UnprocessableEntityException(
        `Artifact ${artifactId} is not ready for content retrieval (status: ${artifact.status})`,
      );
    }

    await this.trackEvent.execute({
      sessionId,
      reportId: artifact.reportId,
      eventType: AnalyticsEventType.ARTIFACT_VIEWED,
      payload: { artifactId, type: artifact.type, access: 'content' },
    });

    const stored = await this.storage.getObject(artifact.storageKey);
    return {
      body: stored.body,
      contentType: stored.contentType ?? artifact.mimeType ?? 'application/octet-stream',
    };
  }
}
