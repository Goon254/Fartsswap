import type {
  ClassificationBreakdownRowDto,
  NotableMomentDto,
  WrappedBadgeDto,
  WrappedIssueDto,
  WrappedStoryPanelDto,
} from '../interface/http/dto/wrapped.dto';
import { threatRankFromLabel, toRomanYear } from './ritual-math';
import { variantKeyFromReport } from './variant-key';

export interface WrappedReportRow {
  id: string;
  classification: string;
  variantId?: string | null;
  powerScore: number;
  threatLevel: string;
  emotionalTone: string;
  probableCause: string;
  cinematicParallel: string;
  fartName: string;
  fartHash: string;
  createdAtIso: string;
  platformMetadata?: Record<string, unknown> | null;
}

function dominantThreatMode(reports: WrappedReportRow[]): 'Green' | 'Amber' | 'Red' | 'Cerulean' {
  const counts = new Map<string, number>();
  for (const r of reports) {
    counts.set(r.threatLevel, (counts.get(r.threatLevel) ?? 0) + 1);
  }
  let pick = 'Green';
  let pickCount = -1;
  let pickRank = -1;
  for (const [label, c] of counts) {
    const rk = threatRankFromLabel(label);
    if (c > pickCount || (c === pickCount && rk > pickRank)) {
      pick = label;
      pickCount = c;
      pickRank = rk;
    }
  }
  return ['Green', 'Amber', 'Red', 'Cerulean'].includes(pick) ? (pick as 'Green' | 'Amber' | 'Red' | 'Cerulean') : 'Amber';
}

function primaryBucket(reports: WrappedReportRow[]): { key: string; classification: string; count: number } {
  const m = new Map<string, { classification: string; count: number }>();
  for (const r of reports) {
    const k = variantKeyFromReport(r.classification, r.variantId);
    const cur = m.get(k) ?? { classification: r.classification, count: 0 };
    cur.count += 1;
    m.set(k, cur);
  }
  let bestKey = '';
  let best = { classification: '', count: -1 };
  for (const [k, v] of m) {
    if (v.count > best.count) {
      best = v;
      bestKey = k;
    }
  }
  return { key: bestKey, classification: best.classification, count: best.count };
}

export function buildWrappedIssue(args: {
  reports: WrappedReportRow[];
  sessionId: string;
  cohortYear: number;
  nationalAverageScore: number;
  percentile: number;
  shareViewCount: number;
  challengeOpenCount: number;
  premiumIntentCount: number;
  issuedAtIso: string;
}): WrappedIssueDto {
  const { reports } = args;
  const primary = primaryBucket(reports);
  const share = primary.count / reports.length;
  const avg = reports.reduce((a, r) => a + r.powerScore, 0) / reports.length;
  const dominantThreat = dominantThreatMode(reports);
  const ordered = [...reports].sort((a, b) => b.powerScore - a.powerScore);
  const peak = ordered[0];
  if (!peak) {
    throw new Error('buildWrappedIssue requires at least one report row');
  }
  const roman = toRomanYear(args.cohortYear);
  const sid = args.sessionId.replace(/-/g, '').slice(-6).toUpperCase();
  const wrappedCycleId = `WRAPPED-${roman}-${sid}`;
  const cycleLabel = `${roman} · ANNUAL REVIEW (COHORT)`;
  const pct = args.percentile;
  const rankLabel =
    pct >= 90
      ? `Top ${100 - pct}% of filers in the ${args.cohortYear} bureau cohort`
      : pct >= 70
        ? `Upper quartile (${pct}th percentile) · ${args.cohortYear} cohort`
        : pct >= 40
          ? `Mid cohort (${pct}th percentile) · ${args.cohortYear}`
          : `Below median (${pct}th percentile) · provisional framing`;

  const breakdownMap = new Map<string, { classification: string; count: number }>();
  for (const r of reports) {
    const k = variantKeyFromReport(r.classification, r.variantId);
    const cur = breakdownMap.get(k) ?? { classification: r.classification, count: 0 };
    cur.count += 1;
    breakdownMap.set(k, cur);
  }
  const breakdownRows = [...breakdownMap.entries()]
    .map(([variantId, v]) => ({
      variantId,
      classification: v.classification,
      count: v.count,
      share: Math.round((v.count / reports.length) * 1000) / 10,
    }))
    .sort((a, b) => b.count - a.count);
  const top = breakdownRows.slice(0, 5);
  const rest = breakdownRows.slice(5);
  const otherCount = rest.reduce((a, b) => a + b.count, 0);
  const classificationBreakdown: ClassificationBreakdownRowDto[] = [
    ...top.map((t) => ({
      classification: t.classification,
      variantId: t.variantId,
      share: Math.round(t.share * 10) / 10,
      count: t.count,
    })),
    ...(otherCount > 0
      ? ([
          {
            classification: 'Other / mixed ledger',
            variantId: rest[0]?.variantId ?? 'other',
            share: Math.round((otherCount / reports.length) * 1000) / 10,
            count: otherCount,
          },
        ] as ClassificationBreakdownRowDto[])
      : []),
  ];

  const runner = breakdownRows.find((b) => b.variantId !== primary.key);

  const seeded = reports.some((r) => Boolean(r.platformMetadata && (r.platformMetadata as { seeded?: boolean }).seeded));

  const storyPanels: WrappedStoryPanelDto[] = [
    {
      id: 'panel_dominant',
      code: 'CHAPTER · 01',
      label: 'DOMINANT CLASSIFICATION',
      headline: primary.classification,
      value: `${Math.round(share * 100)}`,
      unit: 'OF CYCLE FILINGS',
      body: `Your dossier cluster leans toward ${primary.classification}. The Bureau indexed ${reports.length} completed filing(s) in this session window.`,
      detail: runner
        ? { label: 'RUNNER-UP', value: `${runner.classification} · ${Math.round((runner.count / reports.length) * 100)}%` }
        : { label: 'COHERENCE', value: 'Single-classification concentration' },
      variantId: primary.key,
    },
    {
      id: 'panel_peak',
      code: 'CHAPTER · 02',
      label: 'PEAK ACOUSTIC EVENT',
      headline: peak.classification,
      value: String(peak.powerScore),
      unit: '/ 100',
      body: peak.probableCause,
      detail: { label: 'FILED', value: peak.createdAtIso.replace('T', ' ').slice(0, 19) + ' UTC' },
      variantId: variantKeyFromReport(peak.classification, peak.variantId),
    },
    {
      id: 'panel_tone',
      code: 'CHAPTER · 03',
      label: 'EMOTIONAL TONE OF RECORD',
      headline: peak.emotionalTone,
      body: 'Derived from the highest-scoring dossier in your session. The Bureau treats tone as descriptive, not diagnostic.',
      detail: { label: 'SESSION MEAN SCORE', value: `${avg.toFixed(1)} / 100` },
    },
    {
      id: 'panel_parallel',
      code: 'CHAPTER · 04',
      label: 'CINEMATIC PARALLEL OF RECORD',
      headline: peak.cinematicParallel,
      body: 'Assigned from the peak dossier. The Cultural Significance desk may revise parallels upon manual review.',
      detail: { label: 'THREAT AT PEAK', value: peak.threatLevel.toUpperCase() },
    },
    {
      id: 'panel_cause',
      code: 'CHAPTER · 05',
      label: 'MOST LIKELY CAUSE CLUSTER',
      headline: peak.probableCause.slice(0, 80) + (peak.probableCause.length > 80 ? '…' : ''),
      body: 'Probable-cause language is transcribed verbatim from the peak filing. No dietary recommendation is implied.',
      detail: {
        label: 'PROPAGATION',
        value: `${args.shareViewCount} share surface open(s) · ${args.challengeOpenCount} challenge open(s)`,
      },
    },
    {
      id: 'panel_share',
      code: 'CHAPTER · 06',
      label: 'NOTORIETY INDEX',
      headline: `${pct}th percentile vs national filing mean`,
      value: String(pct),
      unit: 'PERCENTILE',
      body: `National mean power score (completed dossiers, ${args.cohortYear} cohort): ${args.nationalAverageScore.toFixed(1)}. Your session mean: ${avg.toFixed(1)}.`,
      detail: { label: 'PREMIUM SIGNALS', value: `${args.premiumIntentCount} intent(s) recorded` },
    },
  ];

  if (seeded) {
    storyPanels.push({
      id: 'panel_seed',
      code: 'ANNEX · S',
      label: 'SEED PROTOCOL',
      headline: 'Seeded dossier metadata detected',
      body: 'At least one filing in this session carried operator seed metadata. Wrapped remains query-backed; interpret ceremonial language accordingly.',
      detail: { label: 'PROVENANCE', value: 'SEED / QA PATH' },
    });
  }

  const badges: WrappedBadgeDto[] = [];
  const k = primary.key.toLowerCase();
  const cls = primary.classification.toLowerCase();
  if (k.includes('silent') || cls.includes('silent')) {
    badges.push({
      id: 'badge_silent',
      code: 'DIST · 01',
      title: 'Certified Silent Assassin',
      ribbon: `BUREAU AWARD · ${roman}`,
      body: 'Awarded when stealth-class classifications dominate the session ledger.',
      rarity: `1 IN ${Math.max(14, 110 - pct)} FILERS (EST.)`,
      tone: 'green',
    });
  }
  if (dominantThreat === 'Amber') {
    badges.push({
      id: 'badge_amber',
      code: 'DIST · 02',
      title: 'Amber Condition Laureate',
      ribbon: 'OFFICE OF ARTIFACT ISSUANCE · §6.3',
      body: 'Conferred when Amber is the modal threat level across your filings.',
      rarity: `1 IN ${Math.max(20, 130 - pct)} FILERS (EST.)`,
      tone: 'amber',
    });
  }
  if (args.shareViewCount >= 2) {
    badges.push({
      id: 'badge_resonance',
      code: 'DIST · 03',
      title: 'Departmental Notice of Resonance',
      ribbon: 'OFFICE OF PRESS & DIPLOMATIC CORRESPONDENCE',
      body: 'Issued when share surfaces were opened repeatedly for this session.',
      rarity: `1 IN ${Math.max(24, 150 - pct)} FILERS (EST.)`,
      tone: 'brass',
    });
  }
  if (reports.length >= 5) {
    badges.push({
      id: 'badge_volume',
      code: 'DIST · 04',
      title: 'Acoustic Citizen of the Quarter',
      ribbon: `STATION OPS · ${roman}`,
      body: 'Recognised for sustained filing volume within a single anonymous session.',
      rarity: `1 IN ${Math.max(18, 120 - pct)} FILERS (EST.)`,
      tone: 'cerulean',
    });
  }
  if (badges.length === 0) {
    badges.push({
      id: 'badge_initiate',
      code: 'DIST · 00',
      title: 'Bureau Initiate Ribbon',
      ribbon: 'GENERAL ISSUANCE',
      body: 'Awarded for completing a query-backed wrapped cycle with honourable brevity.',
      rarity: 'COHORT ENTRY',
      tone: 'brass',
    });
  }

  const notableMoments: NotableMomentDto[] = [...reports]
    .sort((a, b) => b.powerScore - a.powerScore)
    .slice(0, 3)
    .map((r, i) => ({
      id: `moment_${i}`,
      label: i === 0 ? 'PEAK ACOUSTIC EVENT' : i === 1 ? 'INCIDENT OF NOTE' : 'FILING OF NOTE',
      classification: r.classification,
      score: r.powerScore,
      threatLevel: ['Green', 'Amber', 'Red', 'Cerulean'].includes(r.threatLevel)
        ? (r.threatLevel as NotableMomentDto['threatLevel'])
        : 'Amber',
      caption: r.fartName,
      variantId: variantKeyFromReport(r.classification, r.variantId),
      issuedAtIso: r.createdAtIso,
    }));

  return {
    wrappedCycleId,
    cycleLabel,
    issuedAtIso: args.issuedAtIso,
    subjectLabel: 'An anonymous citizen',
    subjectAlias: `CITIZEN-${sid}`,
    primaryClassification: primary.classification,
    primaryVariantId: primary.key,
    averagePowerScore: Math.round(avg * 10) / 10,
    dominantThreatLevel: dominantThreat,
    nationalAverageScore: Math.round(args.nationalAverageScore * 10) / 10,
    percentile: pct,
    rankLabel,
    topCaption: `I regret to inform you that my dossier skewed toward ${primary.classification}.`,
    topCinematicParallel: peak.cinematicParallel,
    shareHeadline: `Your session registered ${args.shareViewCount} share surface open(s) in telemetry.`,
    closingStatement:
      'The Bureau compiled this wrapped cycle from persisted filings and client telemetry. Further review is inevitable but not yet scheduled. Issued for personal record under §0.1 of the Release Provision.',
    storyPanels,
    classificationBreakdown,
    notableMoments,
    badges,
    featuredReportId: peak.id,
  };
}
