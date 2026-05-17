import { Inject, Injectable } from '@nestjs/common';
import type { Report, ReportArtifact } from '../../../shared/domain/models';
import { ShareCardStyleVariant } from '../../../shared/domain/types';
import { OBJECT_STORAGE_PORT, type ObjectStoragePort } from '../../../shared/application/ports/object-storage.port';
import {
  SHARE_CARD_RENDERER_PORT,
  type ShareCardRendererPort,
} from './ports/share-card-renderer.port';

export interface ShareCardArtifactGeneratorInput {
  artifact: ReportArtifact;
  report: Report;
  styleVariant: ShareCardStyleVariant;
}

export interface ShareCardArtifactGeneratorResult {
  storageKey: string;
  mimeType: string;
}

/**
 * Renders and stores share-card content. Extractable to a queue worker in a later phase.
 */
@Injectable()
export class ShareCardArtifactGenerator {
  constructor(
    @Inject(SHARE_CARD_RENDERER_PORT) private readonly renderer: ShareCardRendererPort,
    @Inject(OBJECT_STORAGE_PORT) private readonly storage: ObjectStoragePort,
  ) {}

  async generate(input: ShareCardArtifactGeneratorInput): Promise<ShareCardArtifactGeneratorResult> {
    const { artifact, report, styleVariant } = input;
    const rendered = this.renderer.render(report, styleVariant);
    const storageKey = this.buildStorageKey(artifact.reportId, artifact.id);

    await this.storage.putObject({
      key: storageKey,
      body: rendered.html,
      contentType: rendered.mimeType,
    });

    return { storageKey, mimeType: rendered.mimeType };
  }

  private buildStorageKey(reportId: string, artifactId: string): string {
    return `artifacts/share_card/${reportId}/${artifactId}.html`;
  }
}
