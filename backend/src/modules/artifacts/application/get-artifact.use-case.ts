import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { ReportArtifact } from '../../../shared/domain/models';
import { AnalyticsEventType, ArtifactStatus } from '../../../shared/domain/types';
import { OBJECT_STORAGE_PORT, type ObjectStoragePort } from '../../../shared/application/ports/object-storage.port';
import { TrackAnalyticsEventUseCase } from '../../analytics/application/track-analytics-event.use-case';
import {
  REPORT_ARTIFACT_REPOSITORY,
  type ReportArtifactRepository,
} from './ports/report-artifact.repository';

export interface ArtifactWithRetrieval extends ReportArtifact {
  retrievalUrl?: string;
  contentUrl: string;
}

@Injectable()
export class GetArtifactUseCase {
  constructor(
    @Inject(REPORT_ARTIFACT_REPOSITORY) private readonly artifacts: ReportArtifactRepository,
    @Inject(OBJECT_STORAGE_PORT) private readonly storage: ObjectStoragePort,
    private readonly trackEvent: TrackAnalyticsEventUseCase,
  ) {}

  async execute(artifactId: string, sessionId?: string): Promise<ArtifactWithRetrieval> {
    const artifact = await this.artifacts.findById(artifactId);
    if (!artifact) {
      throw new NotFoundException(`Artifact ${artifactId} not found`);
    }

    await this.trackEvent.execute({
      sessionId,
      reportId: artifact.reportId,
      eventType: AnalyticsEventType.ARTIFACT_VIEWED,
      payload: {
        artifactId,
        type: artifact.type,
        status: artifact.status,
      },
    });

    const retrievalUrl =
      artifact.status === ArtifactStatus.READY && artifact.storageKey
        ? await this.storage.getSignedUrl(artifact.storageKey)
        : undefined;

    return {
      ...artifact,
      retrievalUrl,
      contentUrl: `/api/v1/artifacts/${artifactId}/content`,
    };
  }
}
