'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, type FC } from 'react';
import { ArtifactCommerceUpsellStrip } from '@/components/ArtifactCommerceUpsellStrip';
import { BackgroundLayers } from '@/components/BackgroundLayers';
import { BadgeCabinet } from '@/components/BadgeCabinet';
import { ClosingNotice } from '@/components/ClosingNotice';
import { FooterLoreStrip } from '@/components/FooterLoreStrip';
import { Navbar } from '@/components/Navbar';
import { RitualProvenanceStrip } from '@/components/RitualProvenanceStrip';
import { WrappedHeader } from '@/components/WrappedHeader';
import { WrappedHeroCard } from '@/components/WrappedHeroCard';
import { WrappedSharePoster } from '@/components/WrappedSharePoster';
import { WrappedStoryPanel } from '@/components/WrappedStoryPanel';
import { pageView, track } from '@/lib/analytics';
import {
  CURRENT_WRAPPED,
  type ClassificationBreakdownRow,
  type WrappedBadge,
  type WrappedIssue,
  type WrappedStoryPanel as WrappedStoryPanelData,
} from '@/lib/fart-wrapped';
import { parseSeedPayload } from '@/lib/seed';
import { fetchWrappedBySlug, fetchWrappedCurrent, type WrappedEnvelope } from '@/lib/rituals-api';

/**
 * /fart-wrapped orchestrator.
 *
 * Resolves the displayed issue by:
 *   1. Fetching query-backed wrapped from the API (session cookie, or `?slug=`).
 *   2. Falling back to `CURRENT_WRAPPED` when the API returns no issue.
 *   3. Applying optional seed-style overrides from `parseSeedPayload`.
 */
export const FartWrappedClient: FC = () => {
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug');
  const seedPayload = useMemo(() => parseSeedPayload(searchParams), [searchParams]);

  const [envelope, setEnvelope] = useState<WrappedEnvelope | undefined>(undefined);
  const [fetchFailed, setFetchFailed] = useState(false);
  const viewed = useRef(false);
  const realDataTracked = useRef(false);

  useEffect(() => {
    setEnvelope(undefined);
    setFetchFailed(false);
    viewed.current = false;
    realDataTracked.current = false;
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = slug ? await fetchWrappedBySlug(slug) : await fetchWrappedCurrent();
        if (cancelled) return;
        if (data === null) setFetchFailed(true);
        else setEnvelope(data);
      } catch {
        if (!cancelled) setFetchFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const baseIssue: WrappedIssue = envelope?.issue ?? CURRENT_WRAPPED;
  const provenance = envelope?.provenance ?? 'canonical_fallback';

  const issue: WrappedIssue = useMemo(() => {
    if (!seedPayload) return baseIssue;
    let next: WrappedIssue = baseIssue;
    let mutated = false;
    if (seedPayload.targetLabel && seedPayload.targetLabel !== next.subjectLabel) {
      next = { ...next, subjectLabel: seedPayload.targetLabel };
      mutated = true;
    }
    if (typeof seedPayload.powerScore === 'number' && seedPayload.powerScore !== next.averagePowerScore) {
      next = { ...next, averagePowerScore: seedPayload.powerScore };
      mutated = true;
    }
    if (seedPayload.threatLevel && seedPayload.threatLevel !== next.dominantThreatLevel) {
      next = { ...next, dominantThreatLevel: seedPayload.threatLevel };
      mutated = true;
    }
    return mutated ? next : next;
  }, [baseIssue, seedPayload]);

  const hasSeedOverrides = useMemo(() => {
    if (!seedPayload) return false;
    return (
      Boolean(seedPayload.targetLabel && seedPayload.targetLabel !== baseIssue.subjectLabel) ||
      (typeof seedPayload.powerScore === 'number' && seedPayload.powerScore !== baseIssue.averagePowerScore) ||
      Boolean(seedPayload.threatLevel && seedPayload.threatLevel !== baseIssue.dominantThreatLevel)
    );
  }, [seedPayload, baseIssue]);

  useEffect(() => {
    if (viewed.current) return;
    if (envelope === undefined && !fetchFailed) return;
    viewed.current = true;
    pageView('fart_wrapped_view', {
      wrappedCycleId: issue.wrappedCycleId,
      hasOverrides: hasSeedOverrides,
    });
  }, [issue.wrappedCycleId, hasSeedOverrides, envelope, fetchFailed]);

  useEffect(() => {
    if (realDataTracked.current || !envelope?.issue) return;
    if (envelope.provenance !== 'live' && envelope.provenance !== 'low_volume') return;
    realDataTracked.current = true;
    const source = slug ? 'slug' : 'session';
    void track('wrapped_realdata_view', {
      wrappedCycleId: envelope.issue.wrappedCycleId,
      provenance: envelope.provenance,
      source,
    });
    if (source === 'session') {
      const reportCount = envelope.issue.classificationBreakdown.reduce((a, r) => a + r.count, 0);
      void track('wrapped_generated_from_session', {
        wrappedCycleId: envelope.issue.wrappedCycleId,
        reportCount,
        cohortYear: envelope.cohortYear,
      });
    }
  }, [envelope, slug]);

  const hoveredPanels = useRef<Set<string>>(new Set());
  const onStoryOpen = useCallback(
    (panel: WrappedStoryPanelData) => {
      void track('wrapped_story_panel_viewed', {
        wrappedCycleId: issue.wrappedCycleId,
        panelId: panel.id,
        variantId: panel.variantId,
        kind: 'open',
      });
    },
    [issue.wrappedCycleId],
  );
  const onStoryHover = useCallback(
    (panel: WrappedStoryPanelData) => {
      if (hoveredPanels.current.has(panel.id)) return;
      hoveredPanels.current.add(panel.id);
      void track('wrapped_story_panel_viewed', {
        wrappedCycleId: issue.wrappedCycleId,
        panelId: panel.id,
        variantId: panel.variantId,
        kind: 'hover',
      });
    },
    [issue.wrappedCycleId],
  );

  const onClassificationOpened = useCallback(
    (row: ClassificationBreakdownRow) => {
      void track('wrapped_classification_opened', {
        wrappedCycleId: issue.wrappedCycleId,
        classification: row.classification,
        variantId: row.variantId,
      });
    },
    [issue.wrappedCycleId],
  );

  const onBadgeInteract = useCallback(
    (badge: WrappedBadge, kind: 'click' | 'hover') => {
      void track('wrapped_badge_interacted', {
        wrappedCycleId: issue.wrappedCycleId,
        badgeId: badge.id,
        kind,
      });
      if (kind === 'click' && badge.sponsorPlacementId) {
        void track('sponsored_badge_issued', {
          wrappedCycleId: issue.wrappedCycleId,
          badgeId: badge.id,
          placementId: badge.sponsorPlacementId,
        });
      }
    },
    [issue.wrappedCycleId],
  );

  const onShareOpened = useCallback(
    (variantId: string) => {
      void track('wrapped_share_opened', {
        wrappedCycleId: issue.wrappedCycleId,
        variantId,
      });
    },
    [issue.wrappedCycleId],
  );

  const onPosterCopied = useCallback(
    (kind: 'summary' | 'closing') => {
      void track('wrapped_poster_copied', {
        wrappedCycleId: issue.wrappedCycleId,
        kind,
      });
    },
    [issue.wrappedCycleId],
  );

  const commerceReportId =
    envelope?.issue &&
    (envelope.provenance === 'live' || envelope.provenance === 'low_volume') &&
    typeof envelope.issue.featuredReportId === 'string' &&
    envelope.issue.featuredReportId.length > 0
      ? envelope.issue.featuredReportId
      : null;

  const showStrip = fetchFailed || envelope !== undefined;

  return (
    <>
      <BackgroundLayers />

      <div className="relative z-10 flex min-h-dvh flex-col">
        <Navbar />

        <main className="flex flex-1 flex-col gap-14 pb-4 lg:gap-20 lg:pb-6">
          {showStrip ? (
            <div className="pt-4">
              <RitualProvenanceStrip surface="wrapped" provenance={provenance} fetchFailed={fetchFailed} />
            </div>
          ) : null}
          <WrappedHeader issue={issue} />
          <WrappedHeroCard issue={issue} onClassificationOpened={onClassificationOpened} />

          {commerceReportId ? (
            <ArtifactCommerceUpsellStrip
              reportId={commerceReportId}
              variantId={issue.primaryVariantId}
              sourceSurface="wrapped"
            />
          ) : null}

          <section className="mx-auto w-full max-w-7xl px-6 lg:px-10">
            <header className="mb-6 flex flex-wrap items-center gap-3 font-mono text-[0.65rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
              <span aria-hidden="true" className="brand-rule h-px w-8 opacity-90" />
              <span className="rounded-sm border border-[var(--border-brass)] px-1.5 py-px text-[0.6rem]">
                §II
              </span>
              <span>CHAPTERS · CYCLE NARRATIVE</span>
              <span aria-hidden="true" className="brand-rule h-px flex-1 opacity-40" />
              <span className="hidden font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)] md:inline">
                {issue.storyPanels.length} CHAPTERS · ISSUED VERBATIM
              </span>
            </header>
            <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {issue.storyPanels.map((panel, i) => (
                <li key={panel.id} className="flex">
                  <WrappedStoryPanel
                    panel={panel}
                    position={i}
                    onOpen={onStoryOpen}
                    onHover={onStoryHover}
                  />
                </li>
              ))}
            </ul>
          </section>

          <BadgeCabinet badges={issue.badges} onInteract={onBadgeInteract} />
          <WrappedSharePoster issue={issue} onShareOpened={onShareOpened} onPosterCopied={onPosterCopied} />
          <ClosingNotice issue={issue} />
        </main>

        <FooterLoreStrip />
      </div>
    </>
  );
};
