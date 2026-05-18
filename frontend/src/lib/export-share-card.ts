'use client';

import { toPng } from 'html-to-image';

export interface ExportShareCardOptions {
  /** The DOM node to capture. Must be visible (not display:none / hidden). */
  node: HTMLElement;
  /** Final file name without extension, e.g. `farts-com-cerulean-event-report`. */
  fileName: string;
  /**
   * Capture pixel ratio. 3 → ~3x the on-screen resolution, which produces a
   * sharp PNG without ballooning file size. Lower this on very large nodes.
   */
  pixelRatio?: number;
  /** Optional background fill applied to the export canvas (defaults to the node's computed bg). */
  backgroundColor?: string;
}

export interface ExportShareCardResult {
  dataUrl: string;
  fileName: string;
  width: number;
  height: number;
}

/**
 * Capture a DOM node as a PNG and trigger a download.
 *
 * Implementation notes:
 *  - We await `document.fonts.ready` first. Self-hosted Fraunces / Inter /
 *    JetBrains Mono are loaded by next/font as @font-face rules and the
 *    canvas snapshot can otherwise sample the fallback serif/sans for one
 *    frame, producing a noticeably wrong export.
 *  - `cacheBust: true` avoids stale-image issues when the same node is
 *    captured repeatedly.
 *  - We don't `display: none` the node during capture — the caller is
 *    responsible for the node being visible. Hidden / scaled-to-0 nodes
 *    produce a blank PNG.
 *
 * Returns the data URL so callers can do further work (preview, upload,
 * etc.) in addition to the automatic download.
 */
export async function exportShareCard(
  options: ExportShareCardOptions,
): Promise<ExportShareCardResult> {
  const { node, fileName, pixelRatio = 3, backgroundColor } = options;

  if (typeof document !== 'undefined' && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Some browsers reject the promise if no fonts are loaded. Ignore.
    }
  }

  const rect = node.getBoundingClientRect();
  const dataUrl = await toPng(node, {
    pixelRatio,
    cacheBust: true,
    ...(backgroundColor ? { backgroundColor } : {}),
    style: {
      // html-to-image inherits the node's transforms which can interfere
      // with the captured dimensions; reset on the captured root only.
      transform: 'none',
      transformOrigin: 'top left',
    },
  });

  const finalName = `${sanitizeFileName(fileName)}.png`;
  triggerDownload(dataUrl, finalName);

  return {
    dataUrl,
    fileName: finalName,
    width: Math.round(rect.width * pixelRatio),
    height: Math.round(rect.height * pixelRatio),
  };
}

/**
 * Convert a variant id like `cerulean_event` into a filename slug like
 * `cerulean-event`. We prefix the brand + suffix so the file is identifiable
 * after it leaves the lab.
 */
export function shareCardFileName(variantId: string): string {
  const slug = variantId.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `farts-com-${slug || 'report'}-report`;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-z0-9._-]+/gi, '-').slice(0, 96) || 'farts-com-report';
}

function triggerDownload(dataUrl: string, fileName: string): void {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = fileName;
  a.rel = 'noopener';
  // Required by Firefox: anchor must be in the DOM before .click().
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
