import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CLOCK_PORT, type ClockPort } from '../../../shared/application/ports/clock.port';
import { REPORT_REPOSITORY, type ReportRepository } from '../../reports/application/ports/report.repository';
import { buildWrappedIssue, type WrappedReportRow } from '../domain/wrapped-issue.aggregator';
import { clampPercentile } from '../domain/ritual-math';
import type { WrappedEnvelopeDto, WrappedSponsorshipPlacementDto } from '../interface/http/dto/wrapped.dto';
import { SponsorshipResolveService } from '../../sponsorships/application/sponsorship-resolve.service';

/* Raw SQL boundary */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

const PUBLIC_SLUG_RE = /^r[a-f0-9]{12}$/;

function n(v: unknown): number {
  if (v === null || v === undefined) return 0;
  const x = typeof v === 'string' ? parseFloat(v) : Number(v);
  return Number.isFinite(x) ? x : 0;
}

@Injectable()
export class WrappedQueryService {
  constructor(
    @InjectDataSource() private readonly db: DataSource,
    @Inject(CLOCK_PORT) private readonly clock: ClockPort,
    @Inject(REPORT_REPOSITORY) private readonly reports: ReportRepository,
    private readonly sponsorship: SponsorshipResolveService,
  ) {}

  async getCurrentForSession(sessionId: string): Promise<WrappedEnvelopeDto> {
    return this.buildForSession(sessionId);
  }

  async getForSlug(slug: string): Promise<WrappedEnvelopeDto> {
    if (!PUBLIC_SLUG_RE.test(slug)) {
      throw new NotFoundException(`Report ${slug} not found`);
    }
    const report = await this.reports.findReportByPublicSlug(slug);
    if (!report?.sessionId) {
      throw new NotFoundException(`Report ${slug} not found`);
    }
    return this.buildForSession(report.sessionId);
  }

  private async buildForSession(sessionId: string): Promise<WrappedEnvelopeDto> {
    const now = this.clock.now();
    const cohortYear = now.getUTCFullYear();
    const yearStart = new Date(Date.UTC(cohortYear, 0, 1));
    const yearEnd = new Date(Date.UTC(cohortYear + 1, 0, 1));

    const [repRows, natRow, shareRow, chRow, premRow, cohortAvgs, sessionAvgRow] = await Promise.all([
      this.db.query(
        `SELECT id::text, classification, variant_id, power_score, threat_level, emotional_tone,
                probable_cause, cinematic_parallel, fart_name, fart_hash,
                created_at AS created_at, platform_metadata
         FROM reports
         WHERE session_id = $1 AND status = 'completed'
         ORDER BY created_at ASC`,
        [sessionId],
      ),
      this.db.query(
        `SELECT AVG(power_score)::float AS a
         FROM reports
         WHERE status = 'completed' AND created_at >= $1 AND created_at < $2`,
        [yearStart, yearEnd],
      ),
      this.db.query(
        `SELECT COUNT(*)::int AS c
         FROM analytics_events
         WHERE session_id = $1 AND event_type = 'share_view'
           AND created_at >= $2 AND created_at < $3`,
        [sessionId, yearStart, yearEnd],
      ),
      this.db.query(
        `SELECT COUNT(*)::int AS c
         FROM challenge_events ce
         JOIN challenge_links cl ON cl.id = ce.challenge_link_id
         WHERE cl.session_id = $1 AND ce.kind = 'opened'
           AND ce.created_at >= $2 AND ce.created_at < $3`,
        [sessionId, yearStart, yearEnd],
      ),
      this.db.query(
        `SELECT COUNT(*)::int AS c
         FROM premium_intents
         WHERE session_id = $1 AND created_at >= $2 AND created_at < $3`,
        [sessionId, yearStart, yearEnd],
      ),
      this.db.query(
        `SELECT session_id::text AS sid, AVG(power_score)::float AS avg_score
         FROM reports
         WHERE status = 'completed' AND session_id IS NOT NULL
         GROUP BY session_id`,
      ),
      this.db.query(
        `SELECT AVG(power_score)::float AS a
         FROM reports
         WHERE session_id = $1 AND status = 'completed'`,
        [sessionId],
      ),
    ]);

    const reports: WrappedReportRow[] = (repRows as Record<string, unknown>[]).map((r) => ({
      id: String(r.id),
      classification: String(r.classification),
      variantId: typeof r.variant_id === 'string' ? r.variant_id : undefined,
      powerScore: n(r.power_score),
      threatLevel: String(r.threat_level),
      emotionalTone: String(r.emotional_tone),
      probableCause: String(r.probable_cause),
      cinematicParallel: String(r.cinematic_parallel),
      fartName: String(r.fart_name),
      fartHash: String(r.fart_hash),
      createdAtIso: new Date(String(r.created_at)).toISOString(),
      platformMetadata:
        r.platform_metadata !== null && typeof r.platform_metadata === 'object'
          ? (r.platform_metadata as Record<string, unknown>)
          : undefined,
    }));

    if (reports.length === 0) {
      return { provenance: 'canonical_fallback', cohortYear, issue: null };
    }

    const nationalAverageScore = n(natRow[0]?.a) || 61.4;
    const sessionAvg = n(sessionAvgRow[0]?.a);
    const cohortList = cohortAvgs as { sid: string; avg_score: unknown }[];

    let percentile = 50;
    if (cohortList.length >= 8 && Number.isFinite(sessionAvg)) {
      let below = 0;
      let denom = 0;
      for (const row of cohortList) {
        if (row.sid === sessionId) continue;
        denom += 1;
        if (n(row.avg_score) < sessionAvg) below += 1;
      }
      if (denom > 0) {
        percentile = clampPercentile(Math.round((100 * below) / denom));
      }
    } else {
      const meanFromReports = reports.reduce((a, r) => a + r.powerScore, 0) / reports.length;
      percentile = clampPercentile(Math.round(50 + (meanFromReports - nationalAverageScore) * 2.2));
    }

    const shareViewCount = n(shareRow[0]?.c);
    const challengeOpenCount = n(chRow[0]?.c);
    const premiumIntentCount = n(premRow[0]?.c);

    const lowVolume = reports.length < 3;
    const provenance = lowVolume ? 'low_volume' : 'live';

    const issue = buildWrappedIssue({
      reports,
      sessionId,
      cohortYear,
      nationalAverageScore,
      percentile,
      shareViewCount,
      challengeOpenCount,
      premiumIntentCount,
      issuedAtIso: now.toISOString(),
    });

    const badgePlacements = await this.sponsorship.resolveActiveSlots(['sponsored_badge'], {
      trackServed: false,
    });
    const publicPlacements: WrappedSponsorshipPlacementDto[] = badgePlacements.map((p) => ({
      slotCode: p.slotCode,
      campaignId: p.campaignId,
      placementId: p.placementId,
      sponsorPublicLabel: p.sponsorPublicLabel,
      creative: { ...p.creative },
    }));
    let issueOut = issue;
    if (issueOut && badgePlacements.length > 0) {
      for (const p of badgePlacements) {
        if (p.slotCode !== 'sponsored_badge') continue;
        const badgeId = typeof p.creative.badgeId === 'string' ? p.creative.badgeId : '';
        const append =
          typeof p.creative.ribbonAppend === 'string' ? p.creative.ribbonAppend : undefined;
        if (!badgeId) continue;
        issueOut = {
          ...issueOut,
          badges: issueOut.badges.map((b) =>
            b.id === badgeId
              ? { ...b, sponsorRibbonAppend: append, sponsorPlacementId: p.placementId }
              : b,
          ),
        };
      }
    }

    return {
      provenance,
      cohortYear,
      issue: issueOut,
      ...(publicPlacements.length > 0 ? { sponsorship: { placements: publicPlacements } } : {}),
    };
  }
}
