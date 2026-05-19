import { assertOk } from '@/lib/report-from-recording-api';
import type {
  GalleryPublicFeedResponse,
  GalleryReportFiledResponse,
  GallerySubmissionResponse,
  GallerySubmissionRow,
  GalleryUserReportReason,
} from '@/lib/farts-api-types';

export async function fetchPublicFeed(limit = 24): Promise<GalleryPublicFeedResponse> {
  const cap = Math.min(Math.max(limit, 1), 100);
  const res = await fetch(`/api/gallery/feed?limit=${cap}`, {
    method: 'GET',
    cache: 'no-store',
  });
  return assertOk<GalleryPublicFeedResponse>(res);
}

export async function submitReportToGallery(reportId: string): Promise<GallerySubmissionRow> {
  const id = reportId.trim();
  if (!id) throw new Error('Missing report id');
  const res = await fetch('/api/gallery/submissions', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ reportId: id }),
  });
  return assertOk<GallerySubmissionRow>(res);
}

export async function fetchGallerySubmissionForReport(
  reportId: string,
): Promise<GallerySubmissionRow | null> {
  const id = reportId.trim();
  if (!id) throw new Error('Missing report id');
  const res = await fetch(`/api/gallery/submissions/by-report/${encodeURIComponent(id)}`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });
  const body = await assertOk<GallerySubmissionResponse>(res);
  return body.submission ?? null;
}

/** Flag a published bulletin item (anonymous session cookie; one report per session per item). */
export async function fileGalleryFeedReport(args: {
  submissionId: string;
  reasonCode: GalleryUserReportReason;
  details?: string;
}): Promise<GalleryReportFiledResponse> {
  const submissionId = args.submissionId.trim();
  if (!submissionId) throw new Error('Missing submission id');
  const res = await fetch('/api/gallery/reports', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      submissionId,
      reasonCode: args.reasonCode,
      ...(args.details?.trim() ? { details: args.details.trim() } : {}),
    }),
  });
  return assertOk<GalleryReportFiledResponse>(res);
}

/** Same-origin public feed audio (published items only; no session required). */
export function buildGalleryFeedAudioUrl(submissionId: string): string {
  const id = submissionId.trim();
  if (!id) throw new Error('Missing submission id');
  return `/api/gallery/feed/${encodeURIComponent(id)}/audio`;
}
