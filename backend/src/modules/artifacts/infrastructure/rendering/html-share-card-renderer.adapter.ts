import { Injectable } from '@nestjs/common';
import type { Report } from '../../../../shared/domain/models';
import { ShareCardStyleVariant } from '../../../../shared/domain/types';
import type {
  ShareCardRendererPort,
  ShareCardRenderResult,
} from '../../application/ports/share-card-renderer.port';
import { buildShareCardPayload } from '../../domain/share-card-payload';
import { renderShareCardHtml } from '../../domain/share-card-html.renderer';

@Injectable()
export class HtmlShareCardRendererAdapter implements ShareCardRendererPort {
  render(report: Report, styleVariant: ShareCardStyleVariant): ShareCardRenderResult {
    const payload = buildShareCardPayload(report, styleVariant);
    return {
      html: renderShareCardHtml(payload),
      mimeType: 'text/html; charset=utf-8',
    };
  }
}
