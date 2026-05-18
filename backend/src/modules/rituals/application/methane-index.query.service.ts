import { Inject, Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CLOCK_PORT, type ClockPort } from '../../../shared/application/ports/clock.port';
import { buildMethaneIndexIssue, type MethaneFeaturedPick, type MethaneVariantSlice } from '../domain/methane-issue.aggregator';
import { variantKeyFromReport } from '../domain/variant-key';
import type { MethaneIndexEnvelopeDto, MethaneIndexHistoryDto, SponsorshipPlacementPublicDto } from '../interface/http/dto/methane-index.dto';
import { applySponsorshipToMethaneIssue } from '../../sponsorships/domain/apply-methane-sponsorship';
import { SponsorshipResolveService } from '../../sponsorships/application/sponsorship-resolve.service';
import type { SponsorshipSlotCode } from '../../sponsorships/domain/sponsorship-slots';

/* Raw SQL boundary: TypeORM returns loosely typed row bags. */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

const MS_DAY = 86_400_000;
const MS_WEEK = 7 * MS_DAY;

function n(v: unknown): number {
  if (v === null || v === undefined) return 0;
  const x = typeof v === 'string' ? parseFloat(v) : Number(v);
  return Number.isFinite(x) ? x : 0;
}

function sqlKey(v: unknown): string {
  if (typeof v === 'string') return v;
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return '';
}

@Injectable()
export class MethaneIndexQueryService {
  constructor(
    @InjectDataSource() private readonly db: DataSource,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
    private readonly sponsorship: SponsorshipResolveService,
  ) {}

  async getCurrent(): Promise<MethaneIndexEnvelopeDto> {
    const end = this.clock.now();
    const start = new Date(end.getTime() - MS_WEEK);
    return this.buildEnvelope(start, end);
  }

  async getHistory(limitRaw?: number): Promise<MethaneIndexHistoryDto> {
    const lim = Math.min(12, Math.max(1, Math.floor(limitRaw ?? 4)));
    const now = this.clock.now();
    const entries: MethaneIndexEnvelopeDto[] = [];
    for (let i = 0; i < lim; i++) {
      const end = new Date(now.getTime() - i * MS_WEEK);
      const start = new Date(end.getTime() - MS_WEEK);
      entries.push(await this.buildEnvelope(start, end));
    }
    return { entries };
  }

  private async buildEnvelope(start: Date, end: Date): Promise<MethaneIndexEnvelopeDto> {
    const prevEnd = start;
    const prevStart = new Date(start.getTime() - MS_WEEK);
    const nowIso = end.toISOString();
    const label = `${start.toISOString().slice(0, 10)} \u2192 ${end.toISOString().slice(0, 10)} UTC`;

    const [totCur, totPrev, rowsCur, rowsPrev, shareV, shareL, ch, prem, threatRows, featuredRows] =
      await Promise.all([
        this.db.query(
          `SELECT COUNT(*)::int AS c, COALESCE(AVG(power_score), 0)::float AS a
           FROM reports WHERE status = 'completed' AND created_at >= $1 AND created_at < $2`,
          [start, end],
        ),
        this.db.query(
          `SELECT COUNT(*)::int AS c, COALESCE(AVG(power_score), 0)::float AS a
           FROM reports WHERE status = 'completed' AND created_at >= $1 AND created_at < $2`,
          [prevStart, prevEnd],
        ),
        this.db.query(
          `SELECT COALESCE(NULLIF(TRIM(variant_id), ''), regexp_replace(lower(classification), '[^a-z0-9]+', '_', 'g')) AS vk,
                  MIN(classification) AS classification,
                  COUNT(*)::int AS cnt,
                  AVG(power_score)::float AS avg_power,
                  MAX(CASE threat_level WHEN 'Cerulean' THEN 4 WHEN 'Red' THEN 3 WHEN 'Amber' THEN 2 WHEN 'Green' THEN 1 ELSE 0 END)::int AS threat_rank
           FROM reports
           WHERE status = 'completed' AND created_at >= $1 AND created_at < $2
           GROUP BY vk`,
          [start, end],
        ),
        this.db.query(
          `SELECT COALESCE(NULLIF(TRIM(variant_id), ''), regexp_replace(lower(classification), '[^a-z0-9]+', '_', 'g')) AS vk,
                  COUNT(*)::int AS cnt
           FROM reports
           WHERE status = 'completed' AND created_at >= $1 AND created_at < $2
           GROUP BY vk`,
          [prevStart, prevEnd],
        ),
        this.db.query(
          `SELECT COALESCE(NULLIF(TRIM(r.variant_id), ''), regexp_replace(lower(r.classification), '[^a-z0-9]+', '_', 'g')) AS vk,
                  COUNT(*)::int AS n
           FROM analytics_events e
           JOIN reports r ON r.id = e.report_id
           WHERE e.created_at >= $1 AND e.created_at < $2 AND e.event_type = 'share_view'
           GROUP BY vk`,
          [start, end],
        ),
        this.db.query(
          `SELECT COALESCE(NULLIF(TRIM(r.variant_id), ''), regexp_replace(lower(r.classification), '[^a-z0-9]+', '_', 'g')) AS vk,
                  COUNT(*)::int AS n
           FROM share_links sl
           JOIN reports r ON r.id = sl.report_id
           WHERE sl.created_at >= $1 AND sl.created_at < $2
           GROUP BY vk`,
          [start, end],
        ),
        this.db.query(
          `SELECT variant_id AS vk, COUNT(*)::int AS n
           FROM challenge_links
           WHERE created_at >= $1 AND created_at < $2
           GROUP BY variant_id`,
          [start, end],
        ),
        this.db.query(
          `SELECT COALESCE(NULLIF(TRIM(r.variant_id), ''), regexp_replace(lower(r.classification), '[^a-z0-9]+', '_', 'g')) AS vk,
                  COUNT(*)::int AS n
           FROM premium_intents pi
           LEFT JOIN reports r ON r.id = pi.report_id
           WHERE pi.created_at >= $1 AND pi.created_at < $2
           GROUP BY vk`,
          [start, end],
        ),
        this.db.query(
          `SELECT threat_level AS t, COUNT(*)::int AS c
           FROM reports
           WHERE status = 'completed' AND created_at >= $1 AND created_at < $2
           GROUP BY threat_level`,
          [start, end],
        ),
        this.db.query(
          `SELECT id::text, public_slug, variant_id, classification, fart_name, power_score, fart_hash, threat_level,
                  probable_cause, emotional_tone, cinematic_parallel
           FROM reports
           WHERE status = 'completed' AND created_at >= $1 AND created_at < $2
           ORDER BY power_score DESC, created_at DESC
           LIMIT 8`,
          [start, end],
        ),
      ]);

    const reports = n(totCur[0]?.c);
    const prevReports = n(totPrev[0]?.c);
    const avgPower = n(totCur[0]?.a);
    const prevAvgPower = n(totPrev[0]?.a);

    if (reports === 0) {
      return {
        provenance: 'canonical_fallback',
        window: { startIso: start.toISOString(), endIso: end.toISOString(), label },
        issue: null,
      };
    }

    const prevCounts = new Map<string, number>();
    for (const r of rowsPrev as { vk: unknown; cnt: unknown }[]) {
      prevCounts.set(sqlKey(r.vk), n(r.cnt));
    }

    const shareViewMap = new Map<string, number>();
    for (const r of shareV as { vk: unknown; n: unknown }[]) {
      const vk = sqlKey(r.vk);
      if (vk) shareViewMap.set(vk, n(r.n));
    }
    const shareLinkMap = new Map<string, number>();
    for (const r of shareL as { vk: unknown; n: unknown }[]) {
      const vk = sqlKey(r.vk);
      if (vk) shareLinkMap.set(vk, n(r.n));
    }
    const chMap = new Map<string, number>();
    for (const r of ch as { vk: unknown; n: unknown }[]) {
      const vk = sqlKey(r.vk);
      if (vk) chMap.set(vk, n(r.n));
    }
    const premMap = new Map<string, number>();
    for (const r of prem as { vk: unknown; n: unknown }[]) {
      const vk = sqlKey(r.vk);
      if (vk) premMap.set(vk, n(r.n));
    }

    const variants: MethaneVariantSlice[] = (rowsCur as {
      vk: unknown;
      classification: unknown;
      cnt: unknown;
      avg_power: unknown;
      threat_rank: unknown;
    }[]).map((row) => {
      const vk = sqlKey(row.vk) || 'unknown';
      return {
        variantKey: vk,
        classification: typeof row.classification === 'string' ? row.classification : String(row.classification),
        reportCount: n(row.cnt),
        avgPower: n(row.avg_power),
        maxThreatRank: n(row.threat_rank),
        shareViews: shareViewMap.get(vk) ?? 0,
        shareLinks: shareLinkMap.get(vk) ?? 0,
        challengeLinks: chMap.get(vk) ?? 0,
        premiumIntents: premMap.get(vk) ?? 0,
      };
    });

    const threatHistogram: Record<string, number> = {};
    for (const r of threatRows as { t: unknown; c: unknown }[]) {
      const k = typeof r.t === 'string' ? r.t : String(r.t);
      threatHistogram[k] = n(r.c);
    }

    let featured: MethaneFeaturedPick | null = null;
    const fr = featuredRows as {
      id: string;
      public_slug?: string | null;
      variant_id?: string | null;
      classification: string;
      fart_name: string;
      power_score: unknown;
      fart_hash: string;
      threat_level: string;
      probable_cause: string;
      emotional_tone: string;
      cinematic_parallel: string;
    }[];
    const pick = fr[0];
    if (pick !== undefined) {
      const vk = variantKeyFromReport(pick.classification, pick.variant_id);
      const caption = `${pick.classification}. ${pick.emotional_tone}. Filed under bureau automated selection rules.`;
      featured = {
        reportId: pick.id,
        publicSlug: pick.public_slug ?? undefined,
        variantKey: vk,
        classification: pick.classification,
        fartName: pick.fart_name,
        powerScore: n(pick.power_score),
        fartHash: pick.fart_hash,
        threatLevel: pick.threat_level,
        caption,
      };
    }

    const lowVolume = reports < 3;
    const provenance = lowVolume ? 'low_volume' : 'live';

    const issue = buildMethaneIndexIssue({
      windowStart: start,
      windowEnd: end,
      nowIso,
      variants,
      prevCounts,
      totals: { reports, prevReports, avgPower, prevAvgPower },
      threatHistogram,
      featured,
      lowVolume,
    });

    const METHANE_SLOTS: readonly SponsorshipSlotCode[] = [
      'methane_index_powered_by',
      'sponsored_classification',
      'sponsored_probable_cause',
    ];
    const resolved = await this.sponsorship.resolveActiveSlots(METHANE_SLOTS, { trackServed: false });
    const publicPlacements: SponsorshipPlacementPublicDto[] = resolved.map((p) => ({
      slotCode: p.slotCode,
      campaignId: p.campaignId,
      placementId: p.placementId,
      sponsorPublicLabel: p.sponsorPublicLabel,
      creative: { ...p.creative },
    }));
    const issueWithSponsors =
      resolved.length > 0 ? applySponsorshipToMethaneIssue(issue, resolved) : issue;

    return {
      provenance,
      window: { startIso: start.toISOString(), endIso: end.toISOString(), label },
      featuredReportId: featured?.reportId,
      issue: issueWithSponsors,
      ...(publicPlacements.length > 0 ? { sponsorship: { placements: publicPlacements } } : {}),
    };
  }
}
