import { Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import type { ReportArtifact } from '../../../shared/domain/models';
import {
  AnalyticsEventType,
  ArtifactStatus,
  ArtifactType,
  ShareCardStyleVariant,
} from '../../../shared/domain/types';
import { CLOCK_PORT, type ClockPort } from '../../../shared/application/ports/clock.port';
import { ID_GENERATOR_PORT, type IdGeneratorPort } from '../../../shared/application/ports/id-generator.port';
import { QUEUE_PORT, type QueuePort } from '../../../shared/application/ports/queue.port';
import { REPORT_REPOSITORY, type ReportRepository } from '../../reports/application/ports/report.repository';
import { TrackAnalyticsEventUseCase } from '../../analytics/application/track-analytics-event.use-case';
import {
  REPORT_ARTIFACT_REPOSITORY,
  type ReportArtifactRepository,
} from './ports/report-artifact.repository';
import { ShareCardArtifactGenerator } from './share-card-artifact.generator';

export interface GenerateShareCardArtifactCommand {
  reportId: string;
  sessionId?: string;
  styleVariant?: string;
}

export const ARTIFACT_GENERATION_QUEUE = 'artifact-generation';

@Injectable()
export class GenerateShareCardArtifactUseCase {
  constructor(
    @Inject(REPORT_REPOSITORY) private readonly reports: ReportRepository,
    @Inject(REPORT_ARTIFACT_REPOSITORY) private readonly artifacts: ReportArtifactRepository,
    @Inject(ID_GENERATOR_PORT) private readonly ids: IdGeneratorPort,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
    @Inject(QUEUE_PORT) private readonly queue: QueuePort,
    private readonly generator: ShareCardArtifactGenerator,
    private readonly trackEvent: TrackAnalyticsEventUseCase,
  ) {}

  async execute(command: GenerateShareCardArtifactCommand): Promise<ReportArtifact> {
    const report = await this.reports.findReportById(command.reportId);
    if (!report) {
      throw new NotFoundException(`Report ${command.reportId} not found`);
    }

    const styleVariant = this.resolveStyleVariant(command.styleVariant);
    const now = this.clock.now();
    const artifactId = this.ids.generate();

    let artifact: ReportArtifact = {
      id: artifactId,
      reportId: command.reportId,
      type: ArtifactType.SHARE_CARD,
      status: ArtifactStatus.PENDING,
      styleVariant,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    await this.artifacts.save(artifact);

    await this.trackEvent.execute({
      sessionId: command.sessionId,
      reportId: command.reportId,
      eventType: AnalyticsEventType.ARTIFACT_GENERATION_REQUESTED,
      payload: {
        artifactId,
        type: ArtifactType.SHARE_CARD,
        styleVariant,
      },
    });

    await this.queue.enqueue(ARTIFACT_GENERATION_QUEUE, {
      artifactId,
      reportId: command.reportId,
      type: ArtifactType.SHARE_CARD,
      styleVariant,
    });

    artifact = { ...artifact, status: ArtifactStatus.PROCESSING, updatedAt: this.clock.now().toISOString() };
    await this.artifacts.update(artifact);

    try {
      const result = await this.generator.generate({ artifact, report, styleVariant });
      const completedAt = this.clock.now().toISOString();
      artifact = {
        ...artifact,
        status: ArtifactStatus.READY,
        storageKey: result.storageKey,
        mimeType: result.mimeType,
        updatedAt: completedAt,
        completedAt,
      };
      await this.artifacts.update(artifact);

      await this.trackEvent.execute({
        sessionId: command.sessionId,
        reportId: command.reportId,
        eventType: AnalyticsEventType.ARTIFACT_GENERATED,
        payload: {
          artifactId,
          type: ArtifactType.SHARE_CARD,
          storageKey: result.storageKey,
          styleVariant,
        },
      });

      return artifact;
    } catch (error) {
      const failedAt = this.clock.now().toISOString();
      const failureReason = error instanceof Error ? error.message : 'Unknown generation error';
      artifact = {
        ...artifact,
        status: ArtifactStatus.FAILED,
        failureReason,
        updatedAt: failedAt,
        failedAt,
      };
      await this.artifacts.update(artifact);

      await this.trackEvent.execute({
        sessionId: command.sessionId,
        reportId: command.reportId,
        eventType: AnalyticsEventType.ARTIFACT_GENERATION_FAILED,
        payload: {
          artifactId,
          type: ArtifactType.SHARE_CARD,
          failureReason,
        },
      });

      throw new InternalServerErrorException({
        message: 'Share card artifact generation failed',
        artifactId,
        failureReason,
      });
    }
  }

  private resolveStyleVariant(value?: string): ShareCardStyleVariant {
    const normalized = value?.toLowerCase();
    if (normalized === ShareCardStyleVariant.CLINICAL) return ShareCardStyleVariant.CLINICAL;
    if (normalized === ShareCardStyleVariant.DRAMATIC) return ShareCardStyleVariant.DRAMATIC;
    return ShareCardStyleVariant.DEFAULT;
  }
}
