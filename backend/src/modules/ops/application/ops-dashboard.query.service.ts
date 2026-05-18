import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AppConfigService } from '../../../config/config.service';

/* Raw SQL boundary: TypeORM returns loosely typed row bags. */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */

export interface OpsDashboardWindow {
  hours: number;
  sinceIso: string;
  untilIso: string;
  previousSinceIso: string;
}

export interface OpsDashboardMeta {
  nodeEnv: string;
  databaseOk: boolean;
  generatedAtIso: string;
}

export interface OpsKpis {
  reportsTotal: number;
  reportsInWindow: number;
  reportsPreviousWindow: number;
  shareLinksInWindow: number;
  shareLinksPreviousWindow: number;
  shareViewsInWindow: number;
  shareDownloadsSucceededInWindow: number;
  challengeLinksInWindow: number;
  challengeOpensInWindow: number;
  challengeResolvedInWindow: number;
  premiumIntentsInWindow: number;
  sessionsDistinctOnReportsInWindow: number;
  sessionsCreatedInWindow: number;
  avgReportsPerActiveSession: number;
  repeatReportSessionsInWindow: number;
  shareRatePerReport: number | null;
  challengeRatePerReport: number | null;
  premiumIntentRatePerReport: number | null;
  screenshotSuccessRatePerReport: number | null;
}

export interface OpsFunnelStep {
  id: string;
  label: string;
  count: number;
}

export interface OpsVariantRow {
  variantKey: string;
  reportGenerations: number;
  shareViews: number;
  shareDownloadsSucceeded: number;
  challengeLinks: number;
  premiumIntents: number;
  shareRate: number | null;
  challengeRate: number | null;
  premiumRate: number | null;
  screenshotRate: number | null;
}

export interface OpsLedgerRow {
  kind: string;
  occurredAtIso: string;
  ref: string;
  summary: string;
}

export interface OpsDashboardPayload {
  window: OpsDashboardWindow;
  meta: OpsDashboardMeta;
  kpis: OpsKpis;
  funnel: OpsFunnelStep[];
  variants: OpsVariantRow[];
  ledger: OpsLedgerRow[];
}

function n(v: unknown): number {
  if (v === null || v === undefined) return 0;
  const x = typeof v === 'string' ? parseInt(v, 10) : Number(v);
  return Number.isFinite(x) ? x : 0;
}

function rate(num: number, den: number): number | null {
  if (den <= 0) return null;
  return Math.round((num / den) * 10_000) / 10_000;
}

@Injectable()
export class OpsDashboardQueryService {
  private readonly logger = new Logger(OpsDashboardQueryService.name);

  constructor(
    @InjectDataSource() private readonly db: DataSource,
    private readonly config: AppConfigService,
  ) {}

  async getDashboard(hours: number): Promise<OpsDashboardPayload> {
    const h = Math.min(720, Math.max(1, Math.floor(hours)));
    const until = new Date();
    const since = new Date(until.getTime() - h * 3_600_000);
    const prevSince = new Date(since.getTime() - h * 3_600_000);

    let databaseOk = false;
    try {
      await this.db.query('SELECT 1 as ok');
      databaseOk = true;
    } catch (err) {
      this.logger.warn({ err }, 'ops dashboard database ping failed');
    }

    const [
      reportsTotalRow,
      reportsWin,
      reportsPrev,
      shareLinksWin,
      shareLinksPrev,
      shareViewsWin,
      shareDlWin,
      chLinksWin,
      chOpensWin,
      chResWin,
      premWin,
      sessReportsWin,
      sessCreatedWin,
      avgRpsRow,
      repeatSessWin,
    ] = await Promise.all([
      this.db.query(`SELECT COUNT(*)::int AS c FROM reports`),
      this.db.query(`SELECT COUNT(*)::int AS c FROM reports WHERE created_at >= $1`, [since]),
      this.db.query(
        `SELECT COUNT(*)::int AS c FROM reports WHERE created_at >= $1 AND created_at < $2`,
        [prevSince, since],
      ),
      this.db.query(`SELECT COUNT(*)::int AS c FROM share_links WHERE created_at >= $1`, [since]),
      this.db.query(
        `SELECT COUNT(*)::int AS c FROM share_links WHERE created_at >= $1 AND created_at < $2`,
        [prevSince, since],
      ),
      this.db.query(
        `SELECT COUNT(*)::int AS c FROM analytics_events WHERE created_at >= $1 AND event_type = 'share_view'`,
        [since],
      ),
      this.db.query(
        `SELECT COUNT(*)::int AS c FROM analytics_events WHERE created_at >= $1 AND event_type = 'share_download_succeeded'`,
        [since],
      ),
      this.db.query(`SELECT COUNT(*)::int AS c FROM challenge_links WHERE created_at >= $1`, [since]),
      this.db.query(
        `SELECT COUNT(*)::int AS c FROM challenge_events WHERE created_at >= $1 AND kind = 'opened'`,
        [since],
      ),
      this.db.query(
        `SELECT COUNT(*)::int AS c FROM challenge_events WHERE created_at >= $1 AND kind = 'resolved'`,
        [since],
      ),
      this.db.query(`SELECT COUNT(*)::int AS c FROM premium_intents WHERE created_at >= $1`, [since]),
      this.db.query(
        `SELECT COUNT(DISTINCT session_id)::int AS c FROM reports WHERE created_at >= $1 AND session_id IS NOT NULL`,
        [since],
      ),
      this.db.query(`SELECT COUNT(*)::int AS c FROM anonymous_sessions WHERE created_at >= $1`, [since]),
      this.db.query(
        `SELECT CASE WHEN COUNT(DISTINCT session_id) > 0 THEN COUNT(*)::float / COUNT(DISTINCT session_id) ELSE 0 END AS v
         FROM reports WHERE created_at >= $1 AND session_id IS NOT NULL`,
        [since],
      ),
      this.db.query(
        `SELECT COUNT(*)::int AS c FROM (
           SELECT session_id FROM reports
           WHERE created_at >= $1 AND session_id IS NOT NULL
           GROUP BY session_id HAVING COUNT(*) > 1
         ) t`,
        [since],
      ),
    ]);

    const reportsInWindow = n(reportsWin[0]?.c);
    const reportsPreviousWindow = n(reportsPrev[0]?.c);
    const shareLinksInWindow = n(shareLinksWin[0]?.c);
    const shareLinksPreviousWindow = n(shareLinksPrev[0]?.c);
    const shareViewsInWindow = n(shareViewsWin[0]?.c);
    const shareDownloadsSucceededInWindow = n(shareDlWin[0]?.c);
    const challengeLinksInWindow = n(chLinksWin[0]?.c);
    const challengeOpensInWindow = n(chOpensWin[0]?.c);
    const challengeResolvedInWindow = n(chResWin[0]?.c);
    const premiumIntentsInWindow = n(premWin[0]?.c);
    const sessionsDistinctOnReportsInWindow = n(sessReportsWin[0]?.c);
    const sessionsCreatedInWindow = n(sessCreatedWin[0]?.c);
    const avgReportsPerActiveSession = Number(avgRpsRow[0]?.v ?? 0);
    const repeatReportSessionsInWindow = n(repeatSessWin[0]?.c);

    const kpis: OpsKpis = {
      reportsTotal: n(reportsTotalRow[0]?.c),
      reportsInWindow,
      reportsPreviousWindow,
      shareLinksInWindow,
      shareLinksPreviousWindow,
      shareViewsInWindow,
      shareDownloadsSucceededInWindow,
      challengeLinksInWindow,
      challengeOpensInWindow,
      challengeResolvedInWindow,
      premiumIntentsInWindow,
      sessionsDistinctOnReportsInWindow,
      sessionsCreatedInWindow,
      avgReportsPerActiveSession: Math.round(avgReportsPerActiveSession * 100) / 100,
      repeatReportSessionsInWindow,
      shareRatePerReport: rate(shareLinksInWindow, reportsInWindow),
      challengeRatePerReport: rate(challengeLinksInWindow, reportsInWindow),
      premiumIntentRatePerReport: rate(premiumIntentsInWindow, reportsInWindow),
      screenshotSuccessRatePerReport: rate(shareDownloadsSucceededInWindow, reportsInWindow),
    };

    const funnel: OpsFunnelStep[] = [
      { id: 'reports', label: 'Reports generated', count: reportsInWindow },
      { id: 'share_links', label: 'Share links minted', count: shareLinksInWindow },
      { id: 'share_views', label: 'Share surface opens (client)', count: shareViewsInWindow },
      { id: 'challenges', label: 'Challenge links issued', count: challengeLinksInWindow },
      { id: 'challenge_open', label: 'Challenge opens recorded', count: challengeOpensInWindow },
      { id: 'premium', label: 'Premium intents filed', count: premiumIntentsInWindow },
    ];

    const genRows = await this.db.query(
      `SELECT COALESCE(NULLIF(TRIM(variant_id), ''), classification) AS variant_key,
              COUNT(*)::int AS report_generations
       FROM reports
       WHERE created_at >= $1
       GROUP BY 1
       ORDER BY COUNT(*) DESC
       LIMIT 40`,
      [since],
    );

    const shareRows = await this.db.query(
      `SELECT payload->>'variantId' AS variant_key, COUNT(*)::int AS n
       FROM analytics_events
       WHERE created_at >= $1
         AND event_type = 'share_view'
         AND payload ? 'variantId'
         AND NULLIF(TRIM(payload->>'variantId'), '') IS NOT NULL
       GROUP BY 1
       ORDER BY COUNT(*) DESC
       LIMIT 80`,
      [since],
    );

    const dlRows = await this.db.query(
      `SELECT payload->>'variantId' AS variant_key, COUNT(*)::int AS n
       FROM analytics_events
       WHERE created_at >= $1
         AND event_type = 'share_download_succeeded'
         AND payload ? 'variantId'
         AND NULLIF(TRIM(payload->>'variantId'), '') IS NOT NULL
       GROUP BY 1
       ORDER BY COUNT(*) DESC
       LIMIT 80`,
      [since],
    );

    const chRows = await this.db.query(
      `SELECT variant_id AS variant_key, COUNT(*)::int AS n
       FROM challenge_links
       WHERE created_at >= $1
       GROUP BY 1
       ORDER BY COUNT(*) DESC
       LIMIT 80`,
      [since],
    );

    const premRows = await this.db.query(
      `SELECT payload->>'variantId' AS variant_key, COUNT(*)::int AS n
       FROM premium_intents
       WHERE created_at >= $1
         AND payload ? 'variantId'
         AND NULLIF(TRIM(payload->>'variantId'), '') IS NOT NULL
       GROUP BY 1
       ORDER BY COUNT(*) DESC
       LIMIT 80`,
      [since],
    );

    const shareMap = new Map<string, number>();
    for (const r of shareRows as { variant_key: string; n: unknown }[]) {
      if (r.variant_key) shareMap.set(r.variant_key, n(r.n));
    }
    const dlMap = new Map<string, number>();
    for (const r of dlRows as { variant_key: string; n: unknown }[]) {
      if (r.variant_key) dlMap.set(r.variant_key, n(r.n));
    }
    const chMap = new Map<string, number>();
    for (const r of chRows as { variant_key: string; n: unknown }[]) {
      if (r.variant_key) chMap.set(r.variant_key, n(r.n));
    }
    const premMap = new Map<string, number>();
    for (const r of premRows as { variant_key: string; n: unknown }[]) {
      if (r.variant_key) premMap.set(r.variant_key, n(r.n));
    }

    const keys = new Set<string>();
    for (const r of genRows as { variant_key: string }[]) keys.add(r.variant_key);
    for (const k of shareMap.keys()) keys.add(k);
    for (const k of dlMap.keys()) keys.add(k);
    for (const k of chMap.keys()) keys.add(k);
    for (const k of premMap.keys()) keys.add(k);

    const genMap = new Map(
      (genRows as { variant_key: string; report_generations: unknown }[]).map((r) => [
        r.variant_key,
        n(r.report_generations),
      ]),
    );

    const variants: OpsVariantRow[] = [...keys]
      .map((variantKey) => {
        const reportGenerations = genMap.get(variantKey) ?? 0;
        const shareViews = shareMap.get(variantKey) ?? 0;
        const shareDownloadsSucceeded = dlMap.get(variantKey) ?? 0;
        const challengeLinks = chMap.get(variantKey) ?? 0;
        const premiumIntents = premMap.get(variantKey) ?? 0;
        return {
          variantKey,
          reportGenerations,
          shareViews,
          shareDownloadsSucceeded,
          challengeLinks,
          premiumIntents,
          shareRate: rate(shareViews, reportGenerations),
          challengeRate: rate(challengeLinks, reportGenerations),
          premiumRate: rate(premiumIntents, reportGenerations),
          screenshotRate: rate(shareDownloadsSucceeded, reportGenerations),
        };
      })
      .sort((a, b) => b.reportGenerations - a.reportGenerations || b.shareViews - a.shareViews)
      .slice(0, 24);

    const ledger = await this.buildLedger(since);

    return {
      window: {
        hours: h,
        sinceIso: since.toISOString(),
        untilIso: until.toISOString(),
        previousSinceIso: prevSince.toISOString(),
      },
      meta: {
        nodeEnv: this.config.nodeEnv,
        databaseOk,
        generatedAtIso: until.toISOString(),
      },
      kpis,
      funnel,
      variants,
      ledger,
    };
  }

  private async buildLedger(since: Date): Promise<OpsLedgerRow[]> {
    const [rep, shares, chEv, prem] = await Promise.all([
      this.db.query(
        `SELECT id::text, created_at AS at,
                LEFT(COALESCE(fart_name, '') || ' · ' || COALESCE(classification, ''), 120) AS summary
         FROM reports
         ORDER BY created_at DESC
         LIMIT 10`,
      ),
      this.db.query(
        `SELECT id::text, created_at AS at, kind,
                kind || ' · report ' || COALESCE(report_id::text, '') AS summary
         FROM share_events
         WHERE created_at >= $1
         ORDER BY created_at DESC
         LIMIT 10`,
        [since],
      ),
      this.db.query(
        `SELECT id::text, created_at AS at, kind,
                challenge_link_id || ' · ' || COALESCE(LEFT(payload::text, 80), '') AS summary
         FROM challenge_events
         WHERE created_at >= $1
         ORDER BY created_at DESC
         LIMIT 10`,
        [since],
      ),
      this.db.query(
        `SELECT id::text, created_at AS at, kind,
                COALESCE(LEFT(payload::text, 100), '') AS summary
         FROM premium_intents
         WHERE created_at >= $1
         ORDER BY created_at DESC
         LIMIT 10`,
        [since],
      ),
    ]);

    const rows: OpsLedgerRow[] = [];
    for (const r of rep as { id: string; at: Date; summary: string }[]) {
      rows.push({
        kind: 'report',
        occurredAtIso: new Date(r.at).toISOString(),
        ref: r.id,
        summary: r.summary,
      });
    }
    for (const r of shares as { id: string; at: Date; kind: string; summary: string }[]) {
      rows.push({
        kind: `share:${r.kind}`,
        occurredAtIso: new Date(r.at).toISOString(),
        ref: r.id,
        summary: r.summary,
      });
    }
    for (const r of chEv as { id: string; at: Date; kind: string; summary: string }[]) {
      rows.push({
        kind: `challenge:${r.kind}`,
        occurredAtIso: new Date(r.at).toISOString(),
        ref: r.id,
        summary: r.summary,
      });
    }
    for (const r of prem as { id: string; at: Date; kind: string; summary: string }[]) {
      rows.push({
        kind: `premium:${r.kind}`,
        occurredAtIso: new Date(r.at).toISOString(),
        ref: r.id,
        summary: r.summary,
      });
    }
    rows.sort((a, b) => (a.occurredAtIso < b.occurredAtIso ? 1 : -1));
    return rows.slice(0, 32);
  }
}
