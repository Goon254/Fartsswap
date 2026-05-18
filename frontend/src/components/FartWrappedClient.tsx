'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, type FC } from 'react';
import { BackgroundLayers } from '@/components/BackgroundLayers';
import { BadgeCabinet } from '@/components/BadgeCabinet';
import { ClosingNotice } from '@/components/ClosingNotice';
import { FooterLoreStrip } from '@/components/FooterLoreStrip';
import { Navbar } from '@/components/Navbar';
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

/**
 * /fart-wrapped orchestrator.
 *
 * Resolves the displayed issue by:
 *   1. Starting from the canonical `CURRENT_WRAPPED` mock issue.
 *   2. Applying optional seed-style overrides from the URL via
 *      `parseSeedPayload`. The same `s_*` namespace used by /seed is
 *      reused here so operators can issue a "Fart Wrapped for X" link
 *      with the same generator — no new param scheme.
 *
 * Owned analytics:
 *   `fart_wrapped_view`              once on mount
 *   `wrapped_story_panel_viewed`     per story panel (open / hover)
 *   `wrapped_classification_opened`  per breakdown row open
 *   `wrapped_badge_interacted`       per honour interaction
 *   `wrapped_share_opened`           on "Save annual share card"
 *   `wrapped_poster_copied`          on each Copy press
 */
export const FartWrappedClient: FC = () => {
  // Apply seed-style overrides. Only `targetLabel`, `powerScore`, and
  // `threatLevel` are relevant for the Wrapped issue; the rest of the
  // payload (caption / platform / variant) doesn't change a personal
  // cycle summary.
  const searchParams = useSearchParams();
  const seedPayload = useMemo(() => parseSeedPayload(searchParams), [searchParams]);

  const issue: WrappedIssue = useMemo(() => {
    if (!seedPayload) return CURRENT_WRAPPED;
    let mutated = false;
    let next: WrappedIssue = CURRENT_WRAPPED;
    if (seedPayload.targetLabel && seedPayload.targetLabel !== next.subjectLabel) {
      next = { ...next, subjectLabel: seedPayload.targetLabel };
      mutated = true;
    }
    if (
      typeof seedPayload.powerScore === 'number' &&
      seedPayload.powerScore !== next.averagePowerScore
    ) {
      next = { ...next, averagePowerScore: seedPayload.powerScore };
      mutated = true;
    }
    if (seedPayload.threatLevel && seedPayload.threatLevel !== next.dominantThreatLevel) {
      next = { ...next, dominantThreatLevel: seedPayload.threatLevel };
      mutated = true;
    }
    return mutated ? next : next;
  }, [seedPayload]);

  const hasOverrides = issue !== CURRENT_WRAPPED;

  // — Page view —
  const viewed = useRef(false);
  useEffect(() => {
    if (viewed.current) return;
    viewed.current = true;
    pageView('fart_wrapped_view', {
      wrappedCycleId: issue.wrappedCycleId,
      hasOverrides,
    });
  }, [issue.wrappedCycleId, hasOverrides]);

  // — Story panel events. Open fires when the dossier link is clicked;
  //   hover fires once per panel per session so we don't spam. —
  const hoveredPanels = useRef<Set<string>>(new Set());
  const onStoryOpen = useCallback(
    (panel: WrappedStoryPanelData) => {
      track('wrapped_story_panel_viewed', {
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
      track('wrapped_story_panel_viewed', {
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
      track('wrapped_classification_opened', {
        wrappedCycleId: issue.wrappedCycleId,
        classification: row.classification,
        variantId: row.variantId,
      });
    },
    [issue.wrappedCycleId],
  );

  const onBadgeInteract = useCallback(
    (badge: WrappedBadge, kind: 'click' | 'hover') => {
      track('wrapped_badge_interacted', {
        wrappedCycleId: issue.wrappedCycleId,
        badgeId: badge.id,
        kind,
      });
    },
    [issue.wrappedCycleId],
  );

  const onShareOpened = useCallback(
    (variantId: string) => {
      track('wrapped_share_opened', {
        wrappedCycleId: issue.wrappedCycleId,
        variantId,
      });
    },
    [issue.wrappedCycleId],
  );

  const onPosterCopied = useCallback(
    (kind: 'summary' | 'closing') => {
      track('wrapped_poster_copied', {
        wrappedCycleId: issue.wrappedCycleId,
        kind,
      });
    },
    [issue.wrappedCycleId],
  );

  return (
    <>
      <BackgroundLayers />

      <div className="relative z-10 flex min-h-dvh flex-col">
        <Navbar />

        <main className="flex flex-1 flex-col gap-14 pb-4 lg:gap-20 lg:pb-6">
          <WrappedHeader issue={issue} />
          <WrappedHeroCard issue={issue} onClassificationOpened={onClassificationOpened} />

          {/* — Story panels — */}
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
          <WrappedSharePoster
            issue={issue}
            onShareOpened={onShareOpened}
            onPosterCopied={onPosterCopied}
          />
          <ClosingNotice issue={issue} />
        </main>

        <FooterLoreStrip />
      </div>
    </>
  );
};
