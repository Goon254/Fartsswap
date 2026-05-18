'use client';

import { AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackgroundLayers } from '@/components/BackgroundLayers';
import { CaptionPanel } from '@/components/CaptionPanel';
import { DiagnosticGrid } from '@/components/DiagnosticGrid';
import { FooterLoreStrip } from '@/components/FooterLoreStrip';
import { Navbar } from '@/components/Navbar';
import { ResultHeader } from '@/components/ResultHeader';
import { ResultHero } from '@/components/ResultHero';
import { ShareActionRow } from '@/components/ShareActionRow';
import { VariantSwitcher } from '@/components/VariantSwitcher';
import { pageView, track } from '@/lib/analytics';
import { createChallenge, createChallengeLink } from '@/lib/challenge';
import { premiumLinkFor } from '@/lib/premium';
import { getVariant, getVariantById, RESULT_VARIANTS } from '@/lib/result-variants';
import { applySeedOverridesToVariant, parseSeedPayload } from '@/lib/seed';

/**
 * Client orchestrator for the /report route.
 *
 * Holds the selected variant id in component state and renders the full
 * result experience. Variant swaps go through `<AnimatePresence mode="wait">`
 * so the hero, grid, and captions cross-fade in unison and the key prop on
 * each block re-runs their internal stagger.
 *
 * No URL state in this milestone — the variant switcher is presented as an
 * explicit internal tool, not a public deep-link surface. URL-binding can
 * be added later via useSearchParams + Suspense without touching this
 * component's shape.
 */
interface ReportResultClientProps {
  /**
   * Optional initial variant id, sourced from `?variant=` on the route.
   * Falls back to the first variant when missing / unknown.
   */
  initialVariantId?: string | null;
}

export function ReportResultClient({ initialVariantId }: ReportResultClientProps = {}) {
  // Resolve the initial id once. The variant switcher then drives subsequent
  // changes via local state; the URL is not kept in sync (deliberate — see
  // the milestone notes for the analyze flow).
  const [activeId, setActiveId] = useState<string>(
    () => getVariantById(initialVariantId).id || RESULT_VARIANTS[0]?.id || 'silent_assassin',
  );

  // Seed overrides ride the URL (`?s_target=…&s_score=…`). When present
  // they replace the matching variant fields *before* downstream blocks
  // render. When absent, this is a no-op and the dossier renders as-is.
  const searchParams = useSearchParams();
  const seedPayload = useMemo(() => parseSeedPayload(searchParams), [searchParams]);
  const baseVariant = getVariant(activeId);
  const variant = useMemo(
    () => applySeedOverridesToVariant(baseVariant, seedPayload),
    [baseVariant, seedPayload],
  );

  // Page-view fires once on mount with whichever variant we landed on.
  const viewedRef = useRef(false);
  useEffect(() => {
    if (viewedRef.current) return;
    viewedRef.current = true;
    pageView('report_view', { variantId: activeId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Wrap the switcher callback so we can record the from→to transition.
   * Using current `activeId` from the closure (not the setState updater)
   * keeps the side-effect outside the reducer, which is React-safe under
   * strict mode double-invocation.
   */
  const onSwitchVariant = useCallback(
    (nextId: string) => {
      if (nextId !== activeId) {
        track('variant_switched', {
          surface: 'report',
          from: activeId,
          to: nextId,
          method: 'switcher',
        });
      }
      setActiveId(nextId);
    },
    [activeId],
  );

  const onGenerateAnother = useCallback(() => {
    const i = RESULT_VARIANTS.findIndex((v) => v.id === activeId);
    const next = RESULT_VARIANTS[(i + 1) % RESULT_VARIANTS.length];
    track('generate_another_clicked', { surface: 'report', variantId: activeId });
    if (next && next.id !== activeId) {
      track('variant_switched', {
        surface: 'report',
        from: activeId,
        to: next.id,
        method: 'generate_another',
      });
    }
    if (next) setActiveId(next.id);
  }, [activeId]);

  /**
   * "Copy caption" in the ShareActionRow always copies the featured (№01)
   * caption. The per-card copy buttons inside CaptionPanel each fire their
   * own caption_copied with the right captionIndex.
   */
  const onCopyCaption = useCallback(() => {
    const first = variant.captions[0];
    if (first && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(first).catch(() => undefined);
    }
    track('caption_copied', {
      surface: 'report',
      variantId: variant.id,
      captionIndex: 0,
    });
  }, [variant]);

  const onSaveShareCardClick = useCallback(() => {
    track('save_share_card_clicked', { variantId: variant.id });
  }, [variant.id]);

  /**
   * Build a stable challenge for the active variant. The challengeId and
   * issuedAt are fixed per variant-change so:
   *   - cmd-click + regular click + back-button all open the same URL
   *   - analytics `challenge_link_created` correlates 1:1 with the link
   *     the recipient eventually opens.
   *
   * The href is the sender-preview URL (`from=mine`); the /challenge page
   * exposes the recipient-facing URL via its "Copy link" affordance.
   */
  const challenge = useMemo(
    () => createChallenge({ variant, sourceSurface: 'report' }),
    [variant],
  );
  const challengeHref = useMemo(
    () => createChallengeLink(challenge, { preview: true }),
    [challenge],
  );
  const onChallengeClick = useCallback(() => {
    track('challenge_link_created', {
      challengeId: challenge.challengeId,
      variantId: challenge.sourceVariantId,
      score: challenge.sourceScore,
      challengeType: challenge.challengeType,
      sourceSurface: challenge.sourceSurface,
    });
  }, [challenge]);

  const premiumHref = useMemo(() => premiumLinkFor(variant.id, 'report'), [variant.id]);
  const onPremiumClick = useCallback(() => {
    track('premium_cta_clicked', {
      variantId: variant.id,
      location: 'report_action_row',
      sourceSurface: 'report',
    });
  }, [variant.id]);

  return (
    <>
      <BackgroundLayers />

      <div className="relative z-10 flex min-h-dvh flex-col">
        <Navbar />

        <ResultHeader caseFile={variant.caseFile} issuedAtIso={variant.issuedAtIso} />
        <VariantSwitcher activeId={activeId} onChange={onSwitchVariant} />

        <main className="flex-1">
          {/* The hero+grid+captions cross-fade together when the variant changes. */}
          <AnimatePresence mode="wait" initial={false}>
            <ResultHero key={`hero-${variant.id}`} variant={variant} />
          </AnimatePresence>

          <ShareActionRow
            onGenerateAnother={onGenerateAnother}
            onCopyCaption={onCopyCaption}
            shareHref={`/share?variant=${encodeURIComponent(variant.id)}`}
            onSaveShareCardClick={onSaveShareCardClick}
            challengeHref={challengeHref}
            onChallengeClick={onChallengeClick}
            premiumHref={premiumHref}
            onPremiumClick={onPremiumClick}
          />

          <AnimatePresence mode="wait" initial={false}>
            <DiagnosticGrid key={`grid-${variant.id}`} variant={variant} />
          </AnimatePresence>

          <AnimatePresence mode="wait" initial={false}>
            <CaptionPanel key={`captions-${variant.id}`} variant={variant} />
          </AnimatePresence>
        </main>

        <FooterLoreStrip />
      </div>
    </>
  );
}
