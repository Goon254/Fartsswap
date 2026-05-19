import type {
  ArtifactListResponseDto,
  ArtifactResponseDto,
} from '@/lib/farts-api-types';
import { assertOk } from '@/lib/report-from-recording-api';

export interface CreateReportArtifactOptions {
  contentType?: string;
  idempotencyKey?: string;
}

function normalizePathSegments(path: string[]): string[] {
  return path.map((segment) => segment.trim()).filter((segment) => segment.length > 0);
}

function buildReportArtifactsUrl(reportId: string, path?: string[]): string {
  const base = `/api/reports/${encodeURIComponent(reportId)}/artifacts`;
  if (!path?.length) return base;
  return `${base}/${path.map((segment) => encodeURIComponent(segment)).join('/')}`;
}

function buildArtifactsUrl(path: string[]): string {
  return `/api/artifacts/${path.map((segment) => encodeURIComponent(segment)).join('/')}`;
}

/**
 * Rewrites backend artifact content paths to the same-origin BFF proxy.
 * Absolute URLs and other paths are returned unchanged.
 */
export function rewriteArtifactContentUrlToProxy(contentUrl: string): string {
  if (contentUrl.startsWith('/api/artifacts/')) return contentUrl;
  if (contentUrl.startsWith('/api/v1/artifacts/')) {
    return contentUrl.replace(/^\/api\/v1\/artifacts\//, '/api/artifacts/');
  }
  return contentUrl;
}

export async function createReportArtifact(
  reportId: string,
  path: string[],
  body?: BodyInit | null,
  options?: CreateReportArtifactOptions,
): Promise<ArtifactResponseDto> {
  const id = reportId.trim();
  if (!id) throw new Error('Missing report id');

  const segments = normalizePathSegments(path);
  if (segments.length === 0) throw new Error('Missing artifact path');

  const headers: Record<string, string> = {};
  if (options?.contentType) headers['content-type'] = options.contentType;
  if (options?.idempotencyKey) headers['idempotency-key'] = options.idempotencyKey;

  const res = await fetch(buildReportArtifactsUrl(id, segments), {
    method: 'POST',
    ...(Object.keys(headers).length > 0 ? { headers } : {}),
    body: body ?? undefined,
    credentials: 'include',
    cache: 'no-store',
  });

  return assertOk<ArtifactResponseDto>(res);
}

export async function fetchReportArtifacts(
  reportId: string,
  path?: string[],
): Promise<ArtifactResponseDto | ArtifactListResponseDto> {
  const id = reportId.trim();
  if (!id) throw new Error('Missing report id');

  const segments = path ? normalizePathSegments(path) : [];
  const url =
    segments.length > 0 ? buildReportArtifactsUrl(id, segments) : buildReportArtifactsUrl(id);

  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });

  return assertOk<ArtifactResponseDto | ArtifactListResponseDto>(res);
}

export async function fetchArtifactByPath(path: string[]): Promise<ArtifactResponseDto> {
  const segments = normalizePathSegments(path);
  if (segments.length === 0) throw new Error('Missing artifact path');

  const res = await fetch(buildArtifactsUrl(segments), {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });

  return assertOk<ArtifactResponseDto>(res);
}
