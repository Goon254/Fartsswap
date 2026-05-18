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
  challenge,
  perspective,
  hasValidParams,
}: ChallengeFlowClientProps) {
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

  // Fire challenge_link_opened exactly once on mount. Strict-mode safe via
  // a ref guard.
  const openedRef = useRef(false);
  useEffect(() => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            />
          </div>
        </motion.section>

        <FooterLoreStrip />
      </div>
    </>
  );
}
