import type { MethaneIndexIssue } from '@/lib/methane-index';
import type { WrappedIssue } from '@/lib/fart-wrapped';

export type RitualProvenance = 'live' | 'low_volume' | 'canonical_fallback';

export interface SponsorshipPlacementClient {
  slotCode: string;
  campaignId: string;
  placementId: string;
  sponsorPublicLabel: string;
  creative: Record<string, unknown>;
}

export interface MethaneIndexEnvelope {
  provenance: RitualProvenance;
  window: { startIso: string; endIso: string; label: string };
  featuredReportId?: string;
  issue: MethaneIndexIssue | null;
  sponsorship?: { placements: readonly SponsorshipPlacementClient[] };
}

export interface MethaneIndexHistoryPayload {
  entries: readonly MethaneIndexEnvelope[];
}

export interface WrappedEnvelope {
  provenance: RitualProvenance;
  cohortYear: number;
  issue: WrappedIssue | null;
  sponsorship?: { placements: readonly SponsorshipPlacementClient[] };
}

async function parseJson<T>(res: Response): Promise<T | null> {
  if (!res.ok) return null;
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchMethaneIndexCurrent(): Promise<MethaneIndexEnvelope | null> {
  const res = await fetch('/api/rituals/methane-index/current', { cache: 'no-store' });
  return parseJson<MethaneIndexEnvelope>(res);
}

export async function fetchMethaneIndexHistory(limit = 4): Promise<MethaneIndexHistoryPayload | null> {
  const res = await fetch(`/api/rituals/methane-index/history?limit=${encodeURIComponent(String(limit))}`, {
    cache: 'no-store',
  });
  return parseJson<MethaneIndexHistoryPayload>(res);
}

export async function fetchWrappedCurrent(): Promise<WrappedEnvelope | null> {
  const res = await fetch('/api/rituals/wrapped/current', { cache: 'no-store', credentials: 'same-origin' });
  return parseJson<WrappedEnvelope>(res);
}

export async function fetchWrappedBySlug(slug: string): Promise<WrappedEnvelope | null> {
  const res = await fetch(`/api/rituals/wrapped/by-slug/${encodeURIComponent(slug)}`, {
    cache: 'no-store',
    credentials: 'same-origin',
  });
  return parseJson<WrappedEnvelope>(res);
}
