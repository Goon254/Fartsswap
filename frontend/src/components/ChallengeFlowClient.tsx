'use client';

import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackgroundLayers } from '@/components/BackgroundLayers';
import { ChallengeCtaPanel } from '@/components/ChallengeCtaPanel';
import { ChallengeNotice } from '@/components/ChallengeNotice';
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
  challengeFromResponseDto,
  fetchChallengeById,
  isPersistedChallengeId,
  openChallenge,
  resolveChallenge,
} from '@/lib/challenge-api';
import { fetchSponsorshipResolve } from '@/lib/sponsorship-api';

interface ChallengeFlowClientProps {
  challenge: Challenge;
  perspective: ChallengePerspective;
  /** True iff the URL's search params parsed cleanly to a Challenge. */
  hasValidParams: boolean;
}

/**
 * /challenge orchestrator.
 *
 * Wires the three reusable presentation pieces (notice / rival card / CTA
 * panel) and owns the analytics surface for the challenge loop. The page
 * renders the same UI for both sender preview and recipient view; the
 * `perspective` prop switches copy + CTA priority.
 *
 * Routing decisions:
 *   - Accept       → /analyze?path=record&<serialized challenge>
 *   - Fake         → /analyze?path=fake&<serialized challenge>
 *   - Back (recip) → /
 *   - Back (sender)→ /report?variant=<source>
 *
 * The challenge context (variant + score + id + type + source + issuedAt)
 * is appended to the analyze URL so /analyze can forward it to /report on
 * completion — that's the "challenge_context_forwarded" handoff.
 */
export function ChallengeFlowClient({
  challenge: fallbackChallenge,
  perspective,
  hasValidParams,
}: ChallengeFlowClientProps) {
  const challengeId = fallbackChallenge.challengeId.trim();
  const shouldFetchPersisted = isPersistedChallengeId(challengeId);

  const [loadedChallenge, setLoadedChallenge] = useState<Challenge | null>(null);
  const [challengeLoadSettled, setChallengeLoadSettled] = useState(!shouldFetchPersisted);
  const [resolveBusy, setResolveBusy] = useState(false);
  const resolveInFlightRef = useRef(false);
  const backendOpenRecordedRef = useRef<string | null>(null);
  const canResolveBackend = shouldFetchPersisted && loadedChallenge !== null;

  useEffect(() => {
    backendOpenRecordedRef.current = null;
  }, [challengeId]);

  useEffect(() => {
    if (!shouldFetchPersisted) {
      setLoadedChallenge(null);
      setChallengeLoadSettled(true);
      return;
    }

    let cancelled = false;
    setChallengeLoadSettled(false);

    void (async () => {
      try {
        const dto = await fetchChallengeById(challengeId);
        if (!cancelled) {
          setLoadedChallenge(challengeFromResponseDto(dto));
        }
      } catch {
        if (!cancelled) {
          setLoadedChallenge(null);
        }
      } finally {
        if (!cancelled) {
          setChallengeLoadSettled(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [challengeId, shouldFetchPersisted]);

  useEffect(() => {
    if (!shouldFetchPersisted || !challengeLoadSettled || !loadedChallenge) return;
    if (backendOpenRecordedRef.current === challengeId) return;
    backendOpenRecordedRef.current = challengeId;

    let cancelled = false;
    void (async () => {
      try {
        const updated = await openChallenge(
          challengeId,
          JSON.stringify({ payload: { perspective, hasValidParams } }),
          { contentType: 'application/json' },
        );
        if (!cancelled) {
          setLoadedChallenge(challengeFromResponseDto(updated));
        }
      } catch {
        // Non-blocking: challenge page remains usable on open-event failure.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    challengeId,
    shouldFetchPersisted,
    challengeLoadSettled,
    loadedChallenge,
    perspective,
    hasValidParams,
  ]);

  const challenge = loadedChallenge ?? fallbackChallenge;

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
      if (supportingLine) {
        void track('sponsored_challenge_opened', {
          challengeId: challenge.challengeId,
          variantId: challenge.sourceVariantId,
          placementId: p.placementId,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [challenge.challengeId, challenge.sourceVariantId]);

  // Fire challenge_link_opened once per challenge id after fetch settles.
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
  const fakeHref = `/analyze?path=fake&${serialized}`;
  const senderBackHref = `/report?variant=${encodeURIComponent(challenge.sourceVariantId)}`;
  const backHref = perspective === 'sender' ? senderBackHref : '/';
  const recipientLink = useMemo(
    () => createChallengeLink(challenge),
    [challenge],
  );

  const onCtaClicked = useCallback(
    (cta: 'accept' | 'fake' | 'back_to_lab' | 'copy_link') => {
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

    const navigateToAccept = (target: Challenge) => {
      const params = serializeChallenge(target).toString();
      window.location.href = `/analyze?path=record&${params}`;
    };

    if (!canResolveBackend) {
      navigateToAccept(challenge);
      return;
    }
    if (resolveBusy || resolveInFlightRef.current) return;

    resolveInFlightRef.current = true;
    setResolveBusy(true);
    void (async () => {
      try {
        const updated = await resolveChallenge(
          challengeId,
          JSON.stringify({ payload: { cta: 'accept', perspective } }),
          { contentType: 'application/json' },
        );
        const resolved = challengeFromResponseDto(updated);
        setLoadedChallenge(resolved);
        navigateToAccept(resolved);
      } catch {
        navigateToAccept(challenge);
      } finally {
        resolveInFlightRef.current = false;
        setResolveBusy(false);
      }
    })();
  }, [canResolveBackend, challenge, challengeId, onCtaClicked, perspective, resolveBusy]);

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

        {/* — Rival + CTA two-column — */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1], delay: 0.1 }}
          className="mx-auto w-full max-w-7xl px-6 pb-16 pt-10 lg:px-10 lg:pb-24"
        >
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1.5fr_1fr] lg:gap-12">
            <RivalResultCard challenge={challenge} />
            <ChallengeCtaPanel
              challenge={challenge}
              perspective={perspective}
              acceptHref={acceptHref}
              fakeHref={fakeHref}
              backHref={backHref}
              {...(perspective === 'sender' ? { copyableLink: recipientLink } : {})}
              onCtaClicked={onCtaClicked}
              {...(canResolveBackend
                ? {
                    onAcceptChallenge,
                    acceptDisabled: resolveBusy,
                    acceptBusyLabel: resolveBusy ? 'Accepting…' : undefined,
                  }
                : {})}
            />
          </div>
        </motion.section>

        <FooterLoreStrip />
      </div>
    </>
  );
}
