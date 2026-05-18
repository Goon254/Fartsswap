import type { SponsorshipPlacementClient } from '@/lib/rituals-api';

export type { SponsorshipPlacementClient };

export async function fetchSponsorshipResolve(
  slots: string[],
): Promise<readonly SponsorshipPlacementClient[] | null> {
  const q = new URLSearchParams();
  if (slots.length) q.set('slots', slots.join(','));
  const res = await fetch(`/api/sponsorship/resolve?${q.toString()}`, {
    cache: 'no-store',
    credentials: 'same-origin',
  });
  if (!res.ok) return null;
  try {
    const data = (await res.json()) as { placements?: SponsorshipPlacementClient[] };
    return data.placements ?? null;
  } catch {
    return null;
  }
}

export async function recordSponsorshipAttribution(body: {
  placementId: string;
  eventType: 'served' | 'click' | 'preview';
  metadata?: Record<string, unknown>;
}): Promise<boolean> {
  const res = await fetch('/api/sponsorship/attributions', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.ok;
}
