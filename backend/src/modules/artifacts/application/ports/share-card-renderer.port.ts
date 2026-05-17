import type { Report } from '../../../../shared/domain/models';
import type { ShareCardStyleVariant } from '../../../../shared/domain/types';

export interface ShareCardRenderResult {
  html: string;
  mimeType: string;
}

export interface ShareCardRendererPort {
  render(report: Report, styleVariant: ShareCardStyleVariant): ShareCardRenderResult;
}

export const SHARE_CARD_RENDERER_PORT = Symbol('SHARE_CARD_RENDERER_PORT');
