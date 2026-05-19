import type { ChallengePerspective } from '@/lib/challenge';
import type { ChallengeResponseDto } from '@/lib/farts-api-types';

/** Persisted challenge lifecycle phases exposed in the UI. */
export type ChallengeReentryPhase =
  | 'challenge_pending'
  | 'waiting_for_response'
  | 'verdict_ready';

export interface ChallengeReentryStatus {
  phase: ChallengeReentryPhase;
  eyebrow: string;
  headline: string;
  detail: string;
}

function hasResponse(dto: ChallengeResponseDto | null): boolean {
  return dto?.responseReport != null || Boolean(dto?.responseReportId?.trim());
}

/**
 * Derives re-entry copy from persisted challenge DTO fields only.
 * `responseReport` / `responseReportId` ⇒ verdict ready; else awaiting counter-specimen.
 */
export function deriveChallengeReentryStatus(
  dto: ChallengeResponseDto | null,
  loadSettled: boolean,
  perspective: ChallengePerspective,
): ChallengeReentryStatus {
  if (!loadSettled) {
    return {
      phase: 'challenge_pending',
      eyebrow: '§ DOCKET STATUS',
      headline: 'Syncing challenge file…',
      detail: 'Pulling the latest Bureau record for this link.',
    };
  }

  if (hasResponse(dto)) {
    if (perspective === 'sender') {
      return {
        phase: 'verdict_ready',
        eyebrow: '§ DOCKET STATUS',
        headline: 'Response received — verdict ready',
        detail:
          'Your rival filed a counter-specimen. Scroll to the verdict below, or bookmark this same link to check again later.',
      };
    }
    return {
      phase: 'verdict_ready',
      eyebrow: '§ DOCKET STATUS',
      headline: 'Verdict ready',
      detail:
        'Both specimens are on file. Review the ruling below — bookmark this same link to reopen the verdict anytime.',
    };
  }

  if (perspective === 'sender') {
    return {
      phase: 'waiting_for_response',
      eyebrow: '§ DOCKET STATUS',
      headline: 'Awaiting counter-specimen',
      detail:
        'No counter-specimen yet. Send the challenge link, then reopen this same URL for the verdict when they record.',
    };
  }

  return {
    phase: 'waiting_for_response',
    eyebrow: '§ DOCKET STATUS',
    headline: 'Challenge open — your move',
      detail:
      'Hear the challenger, then record your counter-fart. Sent the challenge? Share this link and check back here later.',
  };
}

export function shouldPollForChallengeResponse(
  phase: ChallengeReentryPhase,
  persisted: boolean,
): boolean {
  return persisted && phase === 'waiting_for_response';
}
