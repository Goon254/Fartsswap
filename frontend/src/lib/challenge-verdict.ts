import type { ChallengeReportSummaryDto } from '@/lib/farts-api-types';

export type ChallengeVerdictOutcome = 'challenger_wins' | 'response_wins' | 'tie';

export interface ChallengeVerdictResult {
  outcome: ChallengeVerdictOutcome;
  headline: string;
  subline: string;
}

/** Higher rank = more severe (tiebreaker when power scores match). */
const THREAT_RANK: Record<string, number> = {
  Green: 1,
  Amber: 2,
  Red: 3,
  Cerulean: 4,
};

function threatRank(level: string): number {
  return THREAT_RANK[level] ?? 0;
}

export function canCompareChallengeReports(
  challenger: ChallengeReportSummaryDto | undefined,
  response: ChallengeReportSummaryDto | undefined,
): boolean {
  return challenger != null && response != null;
}

/**
 * Deterministic Bureau ruling from persisted dossier fields only.
 * Primary: powerScore (higher wins). Tiebreaker: threat level rank. Else tie.
 */
export function computeChallengeVerdict(
  challenger: ChallengeReportSummaryDto,
  response: ChallengeReportSummaryDto,
): ChallengeVerdictResult {
  const cPwr = challenger.powerScore;
  const rPwr = response.powerScore;

  if (cPwr > rPwr) {
    return {
      outcome: 'challenger_wins',
      headline: 'Verdict: Challenger wins',
      subline: `PWR ${cPwr} outranked PWR ${rPwr}. The opening specimen carried the docket.`,
    };
  }

  if (rPwr > cPwr) {
    return {
      outcome: 'response_wins',
      headline: 'Verdict: Counter-specimen wins',
      subline: `PWR ${rPwr} outranked PWR ${cPwr}. The counter-submission overturned the challenger.`,
    };
  }

  const cThreat = threatRank(challenger.threatLevel);
  const rThreat = threatRank(response.threatLevel);

  if (cThreat > rThreat) {
    return {
      outcome: 'challenger_wins',
      headline: 'Verdict: Challenger wins',
      subline: `Deadlocked at PWR ${cPwr}; ${challenger.threatLevel} threat outclassed ${response.threatLevel}. Bureau rules for the opener.`,
    };
  }

  if (rThreat > cThreat) {
    return {
      outcome: 'response_wins',
      headline: 'Verdict: Counter-specimen wins',
      subline: `Deadlocked at PWR ${cPwr}; ${response.threatLevel} threat outclassed ${challenger.threatLevel}. The reply specimen prevails.`,
    };
  }

  return {
    outcome: 'tie',
    headline: 'Verdict: Too close to call',
    subline: `Both filed at PWR ${cPwr} with matching ${challenger.threatLevel} threat. The Bureau cannot rule conclusively.`,
  };
}
