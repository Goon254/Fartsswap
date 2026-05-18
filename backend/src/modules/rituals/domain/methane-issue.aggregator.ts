import type {
  BureauCommentaryLineDto,
  ClassificationRowDto,
  FeaturedArtifactDto,
  HeadlineMetricDto,
  MethaneIndexIssueDto,
} from '../interface/http/dto/methane-index.dto';
import { DEFAULT_ARCHIVAL_NOTES, DEFAULT_RITUAL_TEASERS } from './ritual-static';
import {
  classifyMovement,
  formatMovementDelta,
  isoWeekParts,
  rollThreatClimate,
  severityFromThreatLabel,
  threatLabelFromRank,
  toRomanYear,
} from './ritual-math';

export interface MethaneVariantSlice {
  variantKey: string;
  classification: string;
  reportCount: number;
  avgPower: number;
  maxThreatRank: number;
  shareViews: number;
  shareLinks: number;
  challengeLinks: number;
  premiumIntents: number;
}

export interface MethaneFeaturedPick {
  reportId: string;
  publicSlug?: string;
  variantKey: string;
  classification: string;
  fartName: string;
  powerScore: number;
  fartHash: string;
  threatLevel: string;
  caption: string;
}

function compositeIndexScore(v: MethaneVariantSlice, maxReports: number): number {
  const vol = maxReports > 0 ? v.reportCount / maxReports : 0;
  const sharePulse = Math.min(1, v.shareViews / Math.max(8, v.reportCount * 2 + 1));
  const ch = Math.min(1, v.challengeLinks / Math.max(4, v.reportCount + 2));
  return v.avgPower * 0.35 + vol * 42 + sharePulse * 28 + ch * 12 + v.premiumIntents * 3;
}

function weeklyScore(v: MethaneVariantSlice, maxReports: number): number {
  const base = maxReports > 0 ? (v.reportCount / maxReports) * 58 : 0;
  const shareability = Math.min(
    99,
    Math.round(
      Math.min(55, (v.shareViews / Math.max(1, v.reportCount)) * 40) +
        Math.min(44, (v.shareLinks / Math.max(1, v.reportCount)) * 35),
    ),
  );
  return Math.min(99, Math.round(32 + base + shareability * 0.35));
}

function movementNote(movement: ClassificationRowDto['movement'], cls: string, delta: string): string {
  switch (movement) {
    case 'new':
      return `${cls} debuts in the weekly ledger with fresh filings. Bureau intake notes elevated civilian curiosity.`;
    case 'up':
      return `${cls} advanced this window (${delta}). Analysts cite sustained dossier velocity.`;
    case 'down':
      return `${cls} receded versus the prior window (${delta}). Seasonal reversion remains plausible.`;
    case 'volatile':
      return `${cls} exhibits wide intraweek variance (${delta}). The classification remains structurally credible.`;
    default:
      return `${cls} held formation (${delta}). Filing cadence remained within tolerance.`;
  }
}

function coerceThreatLevel(s: string): FeaturedArtifactDto['threatLevel'] {
  if (s === 'Green' || s === 'Amber' || s === 'Red' || s === 'Cerulean') return s;
  return 'Amber';
}

export function buildMethaneIndexIssue(args: {
  windowStart: Date;
  windowEnd: Date;
  nowIso: string;
  variants: MethaneVariantSlice[];
  prevCounts: Map<string, number>;
  totals: { reports: number; prevReports: number; avgPower: number; prevAvgPower: number };
  threatHistogram: Record<string, number>;
  featured: MethaneFeaturedPick | null;
  lowVolume: boolean;
}): MethaneIndexIssueDto {
  const maxSlice = Math.max(1, ...args.variants.map((x) => x.reportCount));
  const sorted = [...args.variants].sort(
    (a, b) => compositeIndexScore(b, maxSlice) - compositeIndexScore(a, maxSlice),
  );
  const maxReports = Math.max(1, ...sorted.map((s) => s.reportCount));

  const climate = rollThreatClimate(args.threatHistogram);
  const { isoYear, isoWeek } = isoWeekParts(args.windowEnd);
  const roman = toRomanYear(isoYear);
  const issueNumber = String(isoWeek).padStart(2, '0');
  const issueId = `MX-${roman}-${issueNumber}`;
  const weekLabel = `WEEK ${isoWeek} · ${roman}`;

  const top = sorted[0];
  const dominantName = top?.classification ?? 'Unclassified';

  const avgTrend =
    args.totals.prevAvgPower > 0
      ? args.totals.avgPower - args.totals.prevAvgPower
      : args.totals.avgPower > 0
        ? 1
        : 0;
  const trendDir = avgTrend > 0.4 ? 'up' : avgTrend < -0.4 ? 'down' : 'flat';
  const trendDelta =
    args.totals.prevAvgPower > 0
      ? `${avgTrend >= 0 ? '+' : ''}${avgTrend.toFixed(1)} W/W`
      : 'BASELINE EST.';

  const volDelta = args.totals.reports - args.totals.prevReports;
  const volTrend = volDelta > 0 ? 'up' : volDelta < 0 ? 'down' : 'flat';

  const topTone = top
    ? (severityFromThreatLabel(threatLabelFromRank(top.maxThreatRank)) as HeadlineMetricDto['tone'])
    : 'neutral';

  const headlineMetrics: HeadlineMetricDto[] = [
    {
      id: 'dominant',
      label: 'DOMINANT CLASSIFICATION',
      value: dominantName,
      hint: 'Ranked by composite bureau index score (volume, share pulse, challenges).',
      tone: topTone,
    },
    {
      id: 'avg_score',
      label: 'AVERAGE POWER SCORE',
      value: args.totals.reports > 0 ? args.totals.avgPower.toFixed(1) : '—',
      unit: '/ 100',
      trend: { direction: trendDir, delta: trendDelta },
      hint: 'Mean power score across all completed dossiers in this window.',
      tone: 'brass',
    },
    {
      id: 'climate',
      label: 'THREAT CLIMATE',
      value: climate.label.split(' · ')[0] ?? climate.label,
      hint: 'Derived from the distribution of issued threat levels this window.',
      tone: climate.band === 'cerulean' ? 'cerulean' : climate.band,
    },
    {
      id: 'advisory',
      label: 'FEATURED ADVISORY',
      value: climate.band === 'green' ? 'Routine posture' : climate.band === 'amber' ? 'Caution advised' : 'Elevated scrutiny',
      hint: 'Automated bureau advisory from aggregate severity posture.',
      tone: climate.band === 'red' || climate.band === 'cerulean' ? climate.band : 'amber',
    },
    {
      id: 'volume',
      label: 'EVENTS UNDER REVIEW',
      value: String(args.totals.reports),
      trend: {
        direction: volTrend,
        delta: `${volDelta >= 0 ? '+' : ''}${volDelta} W/W`,
      },
      hint: 'Completed dossiers filed in the rolling 7-day UTC window.',
      tone: 'brass',
    },
  ];

  const classifications: ClassificationRowDto[] = sorted.slice(0, 12).map((v, i) => {
    const prev = args.prevCounts.get(v.variantKey) ?? 0;
    const movement = classifyMovement(prev, v.reportCount);
    const delta = formatMovementDelta(movement, prev, v.reportCount);
    const threat = threatLabelFromRank(v.maxThreatRank);
    const row: ClassificationRowDto = {
      id: v.variantKey,
      rank: i + 1,
      classification: v.classification,
      variantId: v.variantKey,
      weeklyScore: weeklyScore(v, maxReports),
      movement,
      movementDelta: delta,
      severity: severityFromThreatLabel(threat),
      threatLevel: threat,
      weeklyVolume: v.reportCount,
      shareability: Math.min(
        99,
        Math.round((v.shareViews / Math.max(1, v.reportCount)) * 45 + (v.shareLinks / Math.max(1, v.reportCount)) * 40),
      ),
      note: movementNote(movement, v.classification, delta),
    };
    if (movement === 'new') row.warning = 'NEW · DEBUT';
    return row;
  });

  const pickFeatured = (): FeaturedArtifactDto => {
    if (args.featured) {
      const t = args.featured.threatLevel;
      return {
        variantId: args.featured.variantKey,
        classification: args.featured.classification,
        subjectTitle: args.featured.fartName,
        powerScore: args.featured.powerScore,
        caption: args.featured.caption,
        reportHash: args.featured.fartHash,
        honorific: "TODAY'S BUREAU SELECTION · FART OF THE DAY",
        threatLevel: coerceThreatLevel(t),
        publicSlug: args.featured.publicSlug,
        reportId: args.featured.reportId,
      };
    }
    const f = top;
    const threat = f ? threatLabelFromRank(f.maxThreatRank) : 'Amber';
    return {
      variantId: f?.variantKey ?? 'unknown',
      classification: f?.classification ?? 'Unknown',
      subjectTitle: 'An anonymous filer (ledger redacted)',
      powerScore: f ? Math.round(f.avgPower) : 0,
      caption: 'Featured by aggregate bureau index under provisional issuance rules.',
      reportHash: 'pending',
      honorific: "TODAY'S BUREAU SELECTION · FART OF THE DAY",
      threatLevel: coerceThreatLevel(threat),
    };
  };

  const commentary: BureauCommentaryLineDto[] = [
    {
      id: 'open',
      eyebrow: 'EDITORIAL · §I',
      body: `The National Methane Index reflects ${args.totals.reports} completed dossiers filed in the current UTC window versus ${args.totals.prevReports} in the prior window. Dominant posture: ${dominantName}.`,
      attribution: 'Office of Aggregate Review (Automated Desk)',
    },
    {
      id: 'movers',
      eyebrow: 'EDITORIAL · §II',
      body: `Share-surface opens attributed to dossiers reached ${sorted.reduce((a, v) => a + v.shareViews, 0)} client events this window, alongside ${sorted.reduce((a, v) => a + v.shareLinks, 0)} minted share links.`,
      attribution: 'Office of Press & Diplomatic Correspondence',
    },
    {
      id: 'challenges',
      eyebrow: 'EDITORIAL · §III',
      body: `Challenge propagation: ${sorted.reduce((a, v) => a + v.challengeLinks, 0)} challenge links issued on indexed classifications. Premium intents recorded: ${sorted.reduce((a, v) => a + v.premiumIntents, 0)}.`,
      attribution: 'Department of Forward Containment',
    },
    {
      id: 'closing',
      eyebrow: 'EDITORIAL · §IV',
      body:
        args.lowVolume
          ? 'Issuance volume remains below bureau editorial thresholds. This bulletin is query-backed but statistically thin; interpret movement as provisional.'
          : 'Threat climate reflects aggregate severity only. The Index will refresh on the next rolling window boundary.',
      attribution: 'Bureau Editorial Board',
    },
  ];

  return {
    issueId,
    issueNumber,
    weekLabel,
    issuedAtIso: args.nowIso,
    department: 'DEPARTMENT OF CLASSIFICATION INTELLIGENCE',
    title: 'National Methane Index',
    subtitle:
      'Weekly classification movement derived from completed dossiers, share propagation, challenges, and premium pull-through. Filed for national review.',
    threatClimate: climate.band,
    threatClimateLabel: climate.label,
    headlineMetrics,
    classifications,
    featured: pickFeatured(),
    commentary,
    archivalNotes: DEFAULT_ARCHIVAL_NOTES,
    rituals: DEFAULT_RITUAL_TEASERS,
  };
}
