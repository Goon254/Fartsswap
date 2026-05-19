'use client';

import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackgroundLayers } from '@/components/BackgroundLayers';
import { ChallengeCtaPanel } from '@/components/ChallengeCtaPanel';
import { ChallengeNotice } from '@/components/ChallengeNotice';
import { ChallengeStatusBlock } from '@/components/ChallengeStatusBlock';
import { ChallengeVerdictPanel } from '@/components/ChallengeVerdictPanel';
import { FooterLoreStrip } from '@/components/FooterLoreStrip';
import { Navbar } from '@/components/Navbar';
import { RivalResultCard } from '@/components/RivalResultCard';
import { track } from '@/lib/analytics';
import {
  createChallengeLink,
  serializeChallenge,
  type Challenge,
  type ChallengePerspective,
} from '@/lib/challenge';
import {
  deriveChallengeReentryStatus,
  shouldPollForChallengeResponse,
} from '@/lib/challenge-reentry';
import {
  challengeFromResponseDto,
  fetchChallengeById,
  isPersistedChallengeId,
  openChallenge,
} from '@/lib/challenge-api';
import type { ChallengeResponseDto } from '@/lib/farts-api-types';
import { fetchSponsorshipResolve } from '@/lib/sponsorship-api';

const POLL_INTERVAL_MS = 20_000;

interface ChallengeFlowClientProps {
  challenge: Challenge;
  perspective: ChallengePerspective;
  hasValidParams: boolean;
}

export function ChallengeFlowClient({
  challenge: fallbackChallenge,
  perspective,
  hasValidParams,
}: ChallengeFlowClientProps) {
  const challengeId = fallbackChallenge.challengeId.trim();
  const shouldFetchPersisted = isPersistedChallengeId(challengeId);

  const [challengeDto, setChallengeDto] = useState<ChallengeResponseDto | null>(null);
  const [challengeLoadSettled, setChallengeLoadSettled] = useState(!shouldFetchPersisted);
  const [refreshBusy, setRefreshBusy] = useState(false);
  const backendOpenRecordedRef = useRef<string | null>(null);

  const loadChallenge = useCallback(async () => {
    if (!shouldFetchPersisted) return null;
    return fetchChallengeById(challengeId);
  }, [challengeId, shouldFetchPersisted]);

  const refreshChallenge = useCallback(async () => {
    if (!shouldFetchPersisted) return;
    setRefreshBusy(true);
    try {
      const dto = await loadChallenge();
      if (dto) setChallengeDto(dto);
    } catch {
      // Keep last known state on refresh failure.
    } finally {
      setRefreshBusy(false);
    }
  }, [loadChallenge, shouldFetchPersisted]);

  useEffect(() => {
    backendOpenRecordedRef.current = null;
  }, [challengeId]);

  useEffect(() => {
    if (!shouldFetchPersisted) {
      setChallengeDto(null);
      setChallengeLoadSettled(true);
      return;
    }

    let cancelled = false;
    setChallengeLoadSettled(false);

    void (async () => {
      try {
        const dto = await loadChallenge();
        if (!cancelled) setChallengeDto(dto);
      } catch {
        if (!cancelled) setChallengeDto(null);
      } finally {
        if (!cancelled) setChallengeLoadSettled(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [challengeId, loadChallenge, shouldFetchPersisted]);

  const reentryStatus = useMemo(
    () => deriveChallengeReentryStatus(challengeDto, challengeLoadSettled, perspective),
    [challengeDto, challengeLoadSettled, perspective],
  );

  const pollForResponse = shouldPollForChallengeResponse(reentryStatus.phase, shouldFetchPersisted);

  useEffect(() => {
    if (!pollForResponse) return;

    const tick = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      void refreshChallenge();
    };

    const id = window.setInterval(tick, POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [pollForResponse, refreshChallenge]);

  useEffect(() => {
    if (!shouldFetchPersisted || !challengeLoadSettled || !challengeDto) return;
    if (backendOpenRecordedRef.current === challengeId) return;
    if (perspective !== 'recipient') return;
    if (reentryStatus.phase === 'verdict_ready') return;
    backendOpenRecordedRef.current = challengeId;

    void openChallenge(
      challengeId,
      JSON.stringify({ payload: { perspective, hasValidParams } }),
      { contentType: 'application/json' },
    ).catch(() => undefined);
  }, [
    challengeId,
    shouldFetchPersisted,
    challengeLoadSettled,
    challengeDto,
    perspective,
    hasValidParams,
    reentryStatus.phase,
  ]);

  const challenge = challengeDto
    ? challengeFromResponseDto(challengeDto)
    : fallbackChallenge;

  const showVerdict = reentryStatus.phase === 'verdict_ready';

  const [sponsorChallenge, setSponsorChallenge] = useState<
    { supportingLine?: string; placementId?: string } | undefined
  >(undefined);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const placements = await fetchSponsorshipResolve(['sponsored_challenge']);
      if (cancelled || !placements?.length) return;
      const p = placements.find((x) => x.slotCode === 'sponsored_challenge');
      if (!p) return;
      const supportingLine =
        typeof p.creative.supportingLine === 'string' ? p.creative.supportingLine : undefined;
      setSponsorChallenge({ supportingLine, placementId: p.placementId });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openedRef = useRef(false);
  useEffect(() => {
    openedRef.current = false;
  }, [challengeId]);

  useEffect(() => {
    if (!challengeLoadSettled) return;
    if (openedRef.current) return;
    openedRef.current = true;
    track('challenge_link_opened', {
      challengeId: challenge.challengeId,
      variantId: challenge.sourceVariantId,
      score: challenge.sourceScore,
      challengeType: challenge.challengeType,
      sourceSurface: challenge.sourceSurface,
      perspective,
      hasValidParams,
    });
  }, [challenge, challengeLoadSettled, perspective, hasValidParams]);

  const serialized = useMemo(() => serializeChallenge(challenge).toString(), [challenge]);
  const acceptHref = `/analyze?path=record&${serialized}`;
  const senderBackHref = challengeDto?.reportId
    ? `/report?reportId=${encodeURIComponent(challengeDto.reportId)}`
    : `/report?variant=${encodeURIComponent(challenge.sourceVariantId)}`;
  const backHref = perspective === 'sender' ? senderBackHref : '/';
  const recipientLink = useMemo(() => createChallengeLink(challenge), [challenge]);
  const showRecordCta = reentryStatus.phase === 'waiting_for_response';

  const onCtaClicked = useCallback(
    (cta: 'accept' | 'back_to_lab' | 'copy_link') => {
      track('challenge_cta_clicked', {
        cta,
        challengeId: challenge.challengeId,
        variantId: challenge.sourceVariantId,
        perspective,
      });
    },
    [challenge, perspective],
  );

  const onAcceptChallenge = useCallback(() => {
    onCtaClicked('accept');
    window.location.href = acceptHref;
  }, [acceptHref, onCtaClicked]);

  return (
    <>
      <BackgroundLayers />
      <div className="relative z-10 flex min-h-dvh flex-col">
        <Navbar />

        <ChallengeNotice
          challenge={challenge}
          perspective={perspective}
          {...(sponsorChallenge ? { sponsorChallenge } : {})}
        />

        <div className="mt-6 space-y-6">
          <ChallengeStatusBlock
            status={reentryStatus}
            onRefresh={pollForResponse ? () => void refreshChallenge() : undefined}
            refreshBusy={refreshBusy}
          />

          {showVerdict && challengeDto ? (
            <ChallengeVerdictPanel
              challengeId={challengeId}
              perspective={perspective}
              challenger={challengeDto.challengerReport}
              response={challengeDto.responseReport}
              copyableLink={recipientLink}
            />
          ) : null}

          {!showVerdict ? (
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1], delay: 0.1 }}
              className="mx-auto w-full max-w-7xl px-6 pb-16 lg:px-10 lg:pb-24"
            >
              <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1.5fr_1fr] lg:gap-12">
                <RivalResultCard
                  challenge={challenge}
                  challengerReport={challengeDto?.challengerReport}
                />
                <ChallengeCtaPanel
                  challenge={challenge}
                  perspective={perspective}
                  reentryPhase={reentryStatus.phase}
                  acceptHref={acceptHref}
                  backHref={backHref}
                  showRecordCta={showRecordCta}
                  {...(perspective === 'sender' ? { copyableLink: recipientLink } : {})}
                  onCtaClicked={onCtaClicked}
                  onAcceptChallenge={onAcceptChallenge}
                />
              </div>
            </motion.section>
          ) : null}
        </div>

        <FooterLoreStrip />
      </div>
    </>
  );
};
