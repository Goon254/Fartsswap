import type {
  ApiErrorBody,
  AudioUploadResponseDto,
  CreateReportFromAudioBody,
  ReportResponseDto,
} from '@/lib/farts-api-types';

export class FartsApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody | null;

  constructor(message: string, status: number, body: ApiErrorBody | null) {
    super(message);
    this.name = 'FartsApiError';
    this.status = status;
    this.body = body;
  }
}

async function parseJsonBody<T>(res: Response): Promise<T | null> {
  const ct = res.headers.get('content-type') ?? '';
  if (!ct.includes('application/json')) return null;
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Maps opaque platform errors (e.g. dead Railway domains) into actionable copy. */
export function humanizeApiErrorMessage(message: string): string {
  if (/application not found/i.test(message)) {
    return 'The filing API is unreachable — the backend URL is wrong or the Railway service is down. On Vercel, set FARTS_API_BASE_URL to your live API origin (Railway → service → Settings → Networking → public URL).';
  }
  return message;
}

function errorMessage(status: number, body: ApiErrorBody | null): string {
  let raw: string;
  if (body?.error && typeof body.error === 'string') raw = body.error;
  else if (body?.message) {
    raw = Array.isArray(body.message) ? body.message.join(', ') : body.message;
  } else {
    raw = `Request failed (${status})`;
  }
  return humanizeApiErrorMessage(raw);
}

export async function assertOk<T>(res: Response): Promise<T> {
  const body = await parseJsonBody<T & ApiErrorBody>(res);
  if (!res.ok) {
    throw new FartsApiError(errorMessage(res.status, body), res.status, body);
  }
  if (body === null) {
    throw new FartsApiError('Empty or non-JSON response from server', res.status, null);
  }
  return body;
}

/** Throws on non-OK responses; succeeds for empty bodies (e.g. HTTP 204). */
export async function assertNoContent(res: Response): Promise<void> {
  if (res.ok) return;
  const body = await parseJsonBody<ApiErrorBody>(res);
  throw new FartsApiError(errorMessage(res.status, body), res.status, body);
}

function extensionForMime(mimeType: string): string {
  if (mimeType.includes('webm')) return 'webm';
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('mp4')) return 'm4a';
  return 'bin';
}

export async function uploadAudio(
  blob: Blob,
  mimeType: string,
  durationSeconds?: number,
): Promise<AudioUploadResponseDto> {
  if (!blob || blob.size === 0) {
    throw new Error('Recording is empty');
  }

  const form = new FormData();
  form.append('file', blob, `recording.${extensionForMime(mimeType)}`);
  if (durationSeconds !== undefined && Number.isFinite(durationSeconds)) {
    form.append('durationSeconds', String(durationSeconds));
  }

  const res = await fetch('/api/audio/uploads', {
    method: 'POST',
    body: form,
    credentials: 'include',
    cache: 'no-store',
  });

  return assertOk<AudioUploadResponseDto>(res);
}

export interface CreateReportFromAudioOptions {
  idempotencyKey?: string;
}

export async function createReportFromAudio(
  body: CreateReportFromAudioBody,
  options?: CreateReportFromAudioOptions,
): Promise<ReportResponseDto> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (options?.idempotencyKey) {
    headers['idempotency-key'] = options.idempotencyKey;
  }

  const res = await fetch('/api/reports/from-audio', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    credentials: 'include',
    cache: 'no-store',
  });

  return assertOk<ReportResponseDto>(res);
}

export async function fetchReportById(reportId: string): Promise<ReportResponseDto> {
  const id = reportId.trim();
  if (!id) {
    throw new Error('Missing report id');
  }

  const res = await fetch(`/api/reports/${encodeURIComponent(id)}`, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });

  return assertOk<ReportResponseDto>(res);
}

/** Same-origin private playback URL (session cookie required). */
export function buildReportAudioPlaybackUrl(reportId: string): string {
  const id = reportId.trim();
  if (!id) throw new Error('Missing report id');
  return `/api/reports/${encodeURIComponent(id)}/audio`;
}
