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

function errorMessage(status: number, body: ApiErrorBody | null): string {
  if (body?.error && typeof body.error === 'string') return body.error;
  if (body?.message) {
    return Array.isArray(body.message) ? body.message.join(', ') : body.message;
  }
  return `Request failed (${status})`;
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
