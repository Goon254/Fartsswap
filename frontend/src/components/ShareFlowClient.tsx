'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackgroundLayers } from '@/components/BackgroundLayers';
import { Chip } from '@/components/Chip';
import { FooterLoreStrip } from '@/components/FooterLoreStrip';
import { Navbar } from '@/components/Navbar';
import { ShareCard, ShareCardStage } from '@/components/ShareCard';
import { ShareCardActions } from '@/components/ShareCardActions';
import { ShareVariantSwitcher } from '@/components/ShareVariantSwitcher';
import { pageView, track } from '@/lib/analytics';
import { createChallenge, createChallengeLink } from '@/lib/challenge';
import { exportShareCard, shareCardFileName, type ExportShareCardResult } from '@/lib/export-share-card';
import { premiumLinkFor } from '@/lib/premium';
import {
  getRandomVariant,
  getVariantById,
  RESULT_VARIANTS,
} from '@/lib/result-variants';

interface ShareFlowClientProps {
  initialVariantId?: string | null;
}

const EASE = [0.22, 0.61, 0.36, 1] as const;

/**
 * Client orchestrator for /share.
 *
 * Owns:
 *   - active variant id (initialised from the `?variant=` query)
 *   - a ref to the in-DOM ShareCard, used by the export utility
 *   - the responsive preview scale (the card is 1080×1920 in DOM; we scale
 *     it down for display via ShareCardStage so the export always lands at
 *     poster size regardless of viewport)
 *
 * Layout:
 *   [ Header ribbon                                                       ]
 *   [ Switcher (lightweight)                                              ]
 *   [ Preview stage              ][ Actions (download / copy / open / new)]
 *   [ Footer                                                              ]
 */
export function ShareFlowClient({ initialVariantId }: ShareFlowClientProps = {}) {
  const [activeId, setActiveId] = useState<string>(
    () => getVariantById(initialVariantId).id || RESULT_VARIANTS[0]?.id || 'silent_assassin',
  );
  const variant = getVariantById(activeId);

  const cardRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState<number>(0.34);

  // Compute the preview scale so the 1080×1920 card fits whatever viewport
  // height we're given, capped at a comfortable max. Re-runs on resize.
  useEffect(() => {
    const compute = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // On large screens we share width with the actions column; on small
      // screens the card gets the full width minus padding.
      const isWide = vw >= 1024;
      const availableWidth = isWide ? Math.min(560, vw * 0.45) : Math.min(440, vw - 56);
      const availableHeight = vh * 0.78;
      const next = Math.min(availableWidth / 1080, availableHeight / 1920, 0.5);
      setScale(Math.max(0.18, next));
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  // Page-view fires once for whichever variant we landed on.
  const viewedRef = useRef(false);
  useEffect(() => {
    if (viewedRef.current) return;
    viewedRef.current = true;
    pageView('share_view', { variantId: activeId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Owns the full download lifecycle so the actions component stays
   * presentational. Three events bracket the export call:
   *   share_download_started    (always)
   *   share_download_succeeded  (on resolve, with image dimensions)
   *   share_download_failed     (on reject, with reason + latency)
   */
  const onDownload = useCallback(async (): Promise<ExportShareCardResult> => {
    const node = cardRef.current;
    if (!node) throw new Error('Share card not mounted');
    const startedAt = performance.now();
    track('share_download_started', { variantId: variant.id });
    try {
      const result = await exportShareCard({
        node,
        fileName: shareCardFileName(variant.id),
        pixelRatio: 1, // card already renders at 1080×1920
        backgroundColor: '#050807',
      });
      track('share_download_succeeded', {
        variantId: variant.id,
        fileName: result.fileName,
        width: result.width,
        height: result.height,
        latencyMs: Math.round(performance.now() - startedAt),
      });
      return result;
    } catch (error) {
      track('share_download_failed', {
        variantId: variant.id,
        reason: error instanceof Error ? error.message : 'unknown',
        latencyMs: Math.round(performance.now() - startedAt),
      });
      throw error;
    }
  }, [variant.id]);

  const onSwitchVariant = useCallback(
    (nextId: string) => {
      if (nextId !== activeId) {
        track('variant_switched', {
          surface: 'share',
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
    const next = getRandomVariant(activeId);
    track('generate_another_clicked', { surface: 'share', variantId: activeId });
    if (next.id !== activeId) {
      track('variant_switched', {
        surface: 'share',
        from: activeId,
        to: next.id,
        method: 'generate_another',
      });
    }
    setActiveId(next.id);
  }, [activeId]);

  const onCopyCaption = useCallback(() => {
    track('caption_copied', {
      surface: 'share',
      variantId: variant.id,
      captionIndex: 0,
    });
  }, [variant.id]);

  const onOpenFullDossier = useCallback(() => {
    track('open_full_dossier_clicked', { variantId: variant.id });
  }, [variant.id]);

  // Challenge link is built once per variant and re-used for stable
  // cmd-click / right-click behaviour, mirroring the /report wiring.
  const challenge = useMemo(
    () => createChallenge({ variant, sourceSurface: 'share' }),
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

  const premiumHref = useMemo(() => premiumLinkFor(variant.id, 'share'), [variant.id]);
  const onPremiumClick = useCallback(() => {
    track('premium_cta_clicked', {
      variantId: variant.id,
      location: 'share_actions',
      sourceSurface: 'share',
    });
  }, [variant.id]);

  return (
    <>
      <BackgroundLayers />
      <div className="relative z-10 flex min-h-dvh flex-col">
        <Navbar />

        {/* — Page header — */}
        <motion.section
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE }}
          className="mx-auto w-full max-w-7xl px-6 pt-8 lg:px-10"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="flex items-center gap-3 font-mono text-[0.62rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
                <span aria-hidden="true" className="brand-rule h-px w-8 opacity-90" />
                <span className="rounded-sm border border-[var(--border-brass)] px-1.5 py-px text-[0.6rem]">
                  §05
                </span>
                <span>SHARE-CARD EXPORT · 1080 × 1920</span>
              </div>
              <h1 className="mt-4 max-w-[20ch] font-display text-[2.4rem] font-medium leading-[1.02] tracking-tight text-[var(--text-strong)] sm:text-[2.8rem] md:text-[3.2rem]">
                The artifact that travels.
              </h1>
              <p className="mt-4 max-w-[60ch] text-[0.95rem] leading-relaxed text-[var(--text-default)]">
                A purpose-built poster of the dossier. The watermark, the seal, and the case file
                travel with the image — so even when it leaves Bureau systems, it stays attributable.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Chip tone="brass">9 : 16 · POSTER</Chip>
              <Chip tone="teal" withDot>
                PRESS-READY
              </Chip>
            </div>
          </div>
        </motion.section>

        <ShareVariantSwitcher activeId={activeId} onChange={onSwitchVariant} />

        {/* — Preview + actions — */}
        <section className="mx-auto w-full max-w-7xl px-6 pb-16 pt-8 lg:px-10">
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[auto_22rem] lg:gap-12">
            {/* Preview stage. The 1080×1920 card lives inside ShareCardStage,
                scaled visually but exported at full resolution. */}
            <div className="mx-auto">
              <ShareCardFrame variantClassification={variant.classification} variantCase={variant.caseFile}>
                <ShareCardStage scale={scale}>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={variant.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.35, ease: EASE }}
                    >
                      <ShareCard ref={cardRef} variant={variant} />
                    </motion.div>
                  </AnimatePresence>
                </ShareCardStage>
              </ShareCardFrame>
            </div>

            <ShareCardActions
              variant={variant}
              onDownload={onDownload}
              onGenerateAnother={onGenerateAnother}
              onCopyCaption={onCopyCaption}
              onOpenFullDossier={onOpenFullDossier}
              reportHref={`/report?variant=${encodeURIComponent(variant.id)}`}
              challengeHref={challengeHref}
              onChallengeClick={onChallengeClick}
              premiumHref={premiumHref}
              onPremiumClick={onPremiumClick}
            />
          </div>
        </section>

        <FooterLoreStrip />
      </div>
    </>
  );
}

/**
 * Visual scaffolding around the share-card preview.
 *
 * - Corner ruler labels above + below the stage so the preview reads as a
 *   specimen on a workbench.
 * - Vertical hairline rails reinforce the 9:16 framing without competing
 *   with the card itself.
 */
function ShareCardFrame({
  children,
  variantClassification,
  variantCase,
}: {
  children: React.ReactNode;
  variantClassification: string;
  variantCase: string;
}) {
  return (
    <div className="relative">
      <div className="mb-3 flex items-center justify-between font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
        <span>SPECIMEN · {variantCase}</span>
        <span>POSTER · 1080 × 1920</span>
      </div>
      <div className="relative">
        <div className="absolute -left-3 top-0 h-full w-px bg-[var(--border-subtle)]" />
        <div className="absolute -right-3 top-0 h-full w-px bg-[var(--border-subtle)]" />
        {children}
      </div>
      <div className="mt-3 flex items-center justify-between font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
        <span>{variantClassification.toUpperCase()}</span>
        <span>BUREAU · OPS-04 · vAlpha</span>
      </div>
    </div>
  );
}
