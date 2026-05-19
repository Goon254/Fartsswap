import type { PremiumIntentResponseDto } from '@/lib/farts-api-types';
import { assertNoContent, assertOk } from '@/lib/report-from-recording-api';

export interface RecordPremiumIntentOptions {
  contentType?: string;
}

export async function recordPremiumIntent(
  body: BodyInit | null,
  options?: RecordPremiumIntentOptions,
): Promise<PremiumIntentResponseDto | void> {
  const headers: Record<string, string> = {};
  if (options?.contentType) {
    headers['content-type'] = options.contentType;
  }

  const res = await fetch('/api/premium/intents', {
    method: 'POST',
    ...(Object.keys(headers).length > 0 ? { headers } : {}),
    body: body ?? undefined,
    credentials: 'include',
    cache: 'no-store',
  });

  if (res.status === 204) {
    await assertNoContent(res);
    return;
  }

  return assertOk<PremiumIntentResponseDto>(res);
}
