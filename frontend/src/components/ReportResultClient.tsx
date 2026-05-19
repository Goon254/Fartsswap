'use client';

import { AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArtifactCommerceUpsellStrip } from '@/components/ArtifactCommerceUpsellStrip';
import { BackgroundLayers } from '@/components/BackgroundLayers';
import { CaptionPanel } from '@/components/CaptionPanel';
import { DiagnosticGrid } from '@/components/DiagnosticGrid';
import { FooterLoreStrip } from '@/components/FooterLoreStrip';
import { Navbar } from '@/components/Navbar';
import { ResultHeader } from '@/components/ResultHeader';
import { ResultHero } from '@/components/ResultHero';
import { ShareActionRow } from '@/components/ShareActionRow';
import { GalleryFeedSubmit } from '@/components/GalleryFeedSubmit';
import { SpecimenPlayback } from '@/components/SpecimenPlayback';
import { VariantSwitcher } from '@/components/VariantSwitcher';
import { createReportArtifact, rewriteArtifactContentUrlToProxy } from '@/lib/artifact-api';
import { pageView, track } from '@/lib/analytics';
import { createReportShareLink } from '@/lib/share-api';
import {
  createChallenge as buildLocalChallenge,
  createChallengeLink,
  type Challenge,
  type ChallengeSourceSurface,
  type ChallengeType,
} from '@/lib/challenge';
import { buildCreateChallengeBody, createChallenge as registerChallenge } from '@/lib/challenge-api';
import type {
  ChallengeResponseDto,
  RecordPremiumIntentBodyDto,
  ReportResponseDto,
} from '@/lib/farts-api-types';
import { premiumLinkFor } from '@/lib/premium';
import { recordPremiumIntent } from '@/lib/premium-api';
import { fetchReportById } from '@/lib/report-from-recording-api';
import {
  getVariant,
  getVariantById,
  RESULT_VARIANTS,
  type ResultVariant,
  type ThreatLevel,
} from '@/lib/result-variants';
import { applySeedOverridesToVariant, parseSeedPayload } from '@/lib/seed';

const THREAT_LEVELS: readonly ThreatLevel[] = ['Green', 'Amber', 'Red', 'Cerulean'];
const CHALLENGE_TYPES: readonly ChallengeType[] = ['beat_score', 'rarer_classification', 'open'];
const CHALLENGE_SURFACES: readonly ChallengeSourceSurface[] = ['report', 'share'];

function challengeFromDto(dto: ChallengeResponseDto): Challenge {
  const challengeType = dto.challengeType as ChallengeType;
  const sourceSurface = dto.sourceSurface as ChallengeSourceSurface;
  return {
    challengeId: dto.id,
    sourceVariantId: dto.variantId,
    sourceScore: dto.sourceScore,
    issuedAt: dto.issuedAt,
    challengeType: CHALLENGE_TYPES.includes(challengeType) ? challengeType : 'beat_score',
    sourceSurface: CHALLENGE_SURFACES.includes(sourceSurface) ? sourceSurface : 'report',
  };
}

function isNonEmptyString(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function parseThreatLevel(value: string): ThreatLevel | null {
  const normalized = value.trim();
  return (
    THREAT_LEVELS.find((level) => level.toLowerCase() === normalized.toLowerCase()) ?? null
  );
}

/** Layers persisted server fields onto the active variant (seed overrides preserved underneath). */
function mergeServerReportIntoVariant(
  baseVariant: ResultVariant,
  report: ReportResponseDto,
): ResultVariant {
  let next = baseVariant;

  if (isNonEmptyString(report.fartName)) {
    next = { ...next, subjectTitle: report.fartName.trim() };
  }
  if (isNonEmptyString(report.classification)) {
    next = { ...next, classification: report.classification.trim() };
  }
  if (typeof report.powerScore === 'number' && Number.isFinite(report.powerScore)) {
    next = { ...next, powerScore: report.powerScore };
  }
  if (typeof report.durationMs === 'number' && Number.isFinite(report.durationMs) && report.durationMs > 0) {
    next = { ...next, durationMs: report.durationMs };
  }
  if (isNonEmptyString(report.emotionalTone)) {
    next = { ...next, emotionalTone: report.emotionalTone.trim() };
  }
  if (isNonEmptyString(report.probableCause)) {
    next = { ...next, probableCause: report.probableCause.trim() };
  }
  if (isNonEmptyString(report.cinematicParallel)) {
    next = { ...next, cinematicParallel: report.cinematicParallel.trim() };
  }
  if (isNonEmptyString(report.threatLevel)) {
    const threat = parseThreatLevel(report.threatLevel);
    if (threat) next = { ...next, threatLevel: threat };
  }
  if (isNonEmptyString(report.fartHash)) {
    next = { ...next, reportHash: report.fartHash.trim() };
  }
  if (isNonEmptyString(report.probableCause)) {
    const punch = [report.probableCause.trim(), report.emotionalTone?.trim()]
      .filter(Boolean)
      .join(' ');
    if (punch) {
      next = { ...next, shortSummary: punch.slice(0, 220) };
    }
  }

  return next;
}

function buildReportShareUrl(reportId: string, token: string): string {
  const params = new URLSearchParams({ reportId, share: token });
  return `${window.location.origin}/report?${params.toString()}`;
}

async function copyTextToClipboard(text: string): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // fall through to legacy copy
    }
  }
  if (typeof document === 'undefined') {
    throw new Error('Clipboard unavailable');
  }
  const el = document.createElement('textarea');
  el.value = text;
  el.setAttribute('readonly', '');
  el.style.position = 'fixed';
  el.style.left = '-9999px';
  document.body.appendChild(el);
  el.select();
  try {
    if (!document.execCommand('copy')) {
      throw new Error('Copy failed');
    }
  } finally {
    document.body.removeChild(el);
  }
}

/**
 * Client orchestrator for the /report route.
 *
 * Holds the selected variant id in component state and renders the full
 * result experience. Variant swaps go through `<AnimatePresence mode="wait">`
 * so the hero, grid, and captions cross-fade in unison and the key prop on
 * each block re-runs their internal stagger.
 *
 * No URL sync for the variant switcher (deliberate). `variant` and optional
 * `reportId` query params are read for initial landing and commerce upsell.
 */
interface ReportResultClientProps {
  /**
   * Optional initial variant id, sourced from `?variant=` on the route.
   * Falls back to the first variant when missing / unknown.
   */
  initialVariantId?: string | null;
  /**
   * Optional persisted report id (`?reportId=`) — when present, shows the
   * post-generation artifact-commerce strip without altering the free dossier.
   */
  initialReportId?: string | null;
}

export function ReportResultClient({
  initialVariantId,
  initialReportId,
}: ReportResultClientProps = {}) {
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
  const reportIdFromQuery = searchParams.get('reportId');
  const commerceReportId = initialReportId ?? reportIdFromQuery;
  const persistedReportId = useMemo(() => {
    const trimmed = commerceReportId?.trim();
    return trimmed || null;
  }, [commerceReportId]);

  const [serverReport, setServerReport] = useState<ReportResponseDto | null>(null);
  const [reportFetchError, setReportFetchError] = useState<string | null>(null);
  const [shareCardBusy, setShareCardBusy] = useState(false);
  const [shareCardError, setShareCardError] = useState<string | null>(null);
  const [shareLinkBusy, setShareLinkBusy] = useState(false);
  const [shareLinkStatus, setShareLinkStatus] = useState<string | null>(null);
  const [registeredChallenge, setRegisteredChallenge] = useState<Challenge | null>(null);
  const [challengeRegisterError, setChallengeRegisterError] = useState<string | null>(null);
  const challengeRegisterReportRef = useRef<string | null>(null);

  useEffect(() => {
    if (!persistedReportId) {
      setServerReport(null);
      setReportFetchError(null);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const report = await fetchReportById(persistedReportId);
        if (!cancelled) {
          setServerReport(report);
          setReportFetchError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setServerReport(null);
          setReportFetchError(e instanceof Error ? e.message : 'Failed to load report');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [persistedReportId]);

  const baseVariant = getVariant(activeId);
  const variantWithSeed = useMemo(
    () => applySeedOverridesToVariant(baseVariant, seedPayload),
    [baseVariant, seedPayload],
  );
  const variant = useMemo(() => {
    if (!serverReport) return variantWithSeed;
    return mergeServerReportIntoVariant(variantWithSeed, serverReport);
  }, [variantWithSeed, serverReport]);

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
    if (!persistedReportId || shareCardBusy) return;

    void (async () => {
      setShareCardBusy(true);
      setShareCardError(null);
      try {
        const artifact = await createReportArtifact(
          persistedReportId,
          ['share-card'],
          JSON.stringify({ styleVariant: 'clinical' }),
          {
            contentType: 'application/json',
            idempotencyKey:
              typeof crypto !== 'undefined' && 'randomUUID' in crypto
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random()}`,
          },
        );
        const contentPath = artifact.contentUrl ?? `/api/v1/artifacts/${artifact.id}/content`;
        const openUrl = rewriteArtifactContentUrlToProxy(contentPath);
        window.open(openUrl, '_blank', 'noopener,noreferrer');
      } catch (e) {
        setShareCardError(e instanceof Error ? e.message : 'Share card generation failed');
      } finally {
        setShareCardBusy(false);
      }
    })();
  }, [persistedReportId, shareCardBusy, variant.id]);

  const onCopyShareLink = useCallback(() => {
    if (!persistedReportId || shareLinkBusy) return;

    void (async () => {
      setShareLinkBusy(true);
      setShareLinkStatus(null);
      try {
        const link = await createReportShareLink(
          persistedReportId,
          JSON.stringify({ kind: 'dossier' }),
          { contentType: 'application/json' },
        );
        const url = buildReportShareUrl(persistedReportId, link.token);
        await copyTextToClipboard(url);
        setShareLinkStatus('Copied');
        window.setTimeout(() => setShareLinkStatus(null), 1800);
      } catch (e) {
        setShareLinkStatus(e instanceof Error ? e.message : 'Failed to copy share link');
      } finally {
        setShareLinkBusy(false);
      }
    })();
  }, [persistedReportId, shareLinkBusy]);

  /**
   * Local draft packet for the active variant. When a persisted report id is
   * present we register this draft with the API and use the returned challenge
   * as the source of truth for the challenge link.
   */
  const challengeDraft = useMemo(
    () => buildLocalChallenge({ variant, sourceSurface: 'report' }),
    [variant],
  );

  useEffect(() => {
    if (!persistedReportId) {
      challengeRegisterReportRef.current = null;
      setRegisteredChallenge(null);
      setChallengeRegisterError(null);
      return;
    }

    if (challengeRegisterReportRef.current === persistedReportId) {
      return;
    }

    let cancelled = false;
    if (serverReport?.source !== 'audio_recording' || serverReport.playbackAvailable !== true) {
      return;
    }

    const body = buildCreateChallengeBody(challengeDraft, persistedReportId);

    void (async () => {
      try {
        const dto = await registerChallenge(JSON.stringify(body), {
          contentType: 'application/json',
        });
        if (!cancelled) {
          setRegisteredChallenge(challengeFromDto(dto));
          setChallengeRegisterError(null);
          challengeRegisterReportRef.current = persistedReportId;
        }
      } catch (e) {
        if (!cancelled) {
          setRegisteredChallenge(null);
          setChallengeRegisterError(
            e instanceof Error ? e.message : 'Challenge registration failed',
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // Register once per persisted report; variant switcher must not re-post challenges.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- challengeDraft is read at registration time only
  }, [persistedReportId, serverReport?.source, serverReport?.playbackAvailable]);

  const challenge = persistedReportId
    ? (registeredChallenge ?? challengeDraft)
    : challengeDraft;

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

    const intentBody: RecordPremiumIntentBodyDto = {
      kind: 'premium_cta_clicked',
      payload: {
        variantId: variant.id,
        location: 'report_action_row',
        sourceSurface: 'report',
      },
      ...(persistedReportId ? { reportId: persistedReportId } : {}),
    };

    void recordPremiumIntent(JSON.stringify(intentBody), {
      contentType: 'application/json',
    }).catch(() => {
      // Best-effort; href navigation to /premium is unchanged on failure.
    });
  }, [persistedReportId, variant.id]);

  // Retained for fallback diagnostics; no dedicated error surface on this page.
  void reportFetchError;

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

          {persistedReportId && serverReport?.playbackAvailable === true ? (
            <div className="mt-6">
              <SpecimenPlayback
                reportId={persistedReportId}
                audioContentType={serverReport.audioContentType}
              />
            </div>
          ) : null}

          {persistedReportId &&
          serverReport?.source === 'audio_recording' &&
          serverReport.playbackAvailable === true ? (
            <div className="mt-6">
              <GalleryFeedSubmit reportId={persistedReportId} />
            </div>
          ) : null}

          <ShareActionRow
            onGenerateAnother={onGenerateAnother}
            onCopyCaption={onCopyCaption}
            shareHref={
              persistedReportId
                ? undefined
                : `/share?variant=${encodeURIComponent(variant.id)}`
            }
            onSaveShareCardClick={onSaveShareCardClick}
            saveShareCardDisabled={shareCardBusy}
            saveShareCardStatus={shareCardError ?? challengeRegisterError}
            onCopyShareLink={persistedReportId ? onCopyShareLink : undefined}
            shareLinkBusy={shareLinkBusy}
            shareLinkStatus={shareLinkStatus}
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

          {commerceReportId ? (
            <ArtifactCommerceUpsellStrip
              reportId={commerceReportId}
              variantId={variant.id}
              sourceSurface="report"
            />
          ) : null}
        </main>

        <FooterLoreStrip />
      </div>
    </>
  );
}
