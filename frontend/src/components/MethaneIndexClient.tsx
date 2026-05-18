'use client';

import { useCallback, useEffect, useRef, type FC } from 'react';
import { BackgroundLayers } from '@/components/BackgroundLayers';
import { BureauCommentary } from '@/components/BureauCommentary';
import { ClassificationMoversTable } from '@/components/ClassificationMoversTable';
import { FeaturedArtifactCard } from '@/components/FeaturedArtifactCard';
import { FooterLoreStrip } from '@/components/FooterLoreStrip';
import { HeroMetricRail } from '@/components/HeroMetricRail';
import { IndexHeader } from '@/components/IndexHeader';
import { Navbar } from '@/components/Navbar';
import { RitualTeaser } from '@/components/RitualTeaser';
import { pageView, track } from '@/lib/analytics';
import { CURRENT_ISSUE, type ClassificationRow } from '@/lib/methane-index';

/**
 * /methane-index orchestrator.
 *
 * One responsibility: stand up the public bulletin and emit the typed
 * analytics for everything operators / journalists do on it.
 *
 * Section order matches the bulletin reading order:
 *   §0    IndexHeader                 masthead + docket strip + filed rail
 *   §I    HeroMetricRail              five headline metrics
 *   §II   ClassificationMoversTable   weekly ledger of classifications
 *   §III  FeaturedArtifactCard        Fart of the Day
 *   §IV   BureauCommentary            editorial commentary block
 *   §V    RitualTeaser                forthcoming rituals + archival notes
 *
 * The issue rendered here is `CURRENT_ISSUE` from `lib/methane-index.ts`.
 * Swap that constant (or feed it from a future endpoint) to ship a new
 * weekly bulletin — no component changes required.
 */
export const MethaneIndexClient: FC = () => {
  const issue = CURRENT_ISSUE;
  const viewed = useRef(false);

  useEffect(() => {
    if (viewed.current) return;
    viewed.current = true;
    pageView('methane_index_view', {
      issueId: issue.issueId,
      issueNumber: issue.issueNumber,
    });
  }, [issue.issueId, issue.issueNumber]);

  const onRowOpened = useCallback(
    (row: ClassificationRow) => {
      track('classification_row_opened', {
        issueId: issue.issueId,
        classificationId: row.id,
        rank: row.rank,
        variantId: row.variantId,
      });
    },
    [issue.issueId],
  );

  const onFeaturedOpened = useCallback(
    (surface: 'report' | 'share') => {
      track('featured_artifact_opened', {
        issueId: issue.issueId,
        variantId: issue.featured.variantId,
        surface,
      });
    },
    [issue.issueId, issue.featured.variantId],
  );

  const onCommentaryMounted = useCallback(
    (lineCount: number) => {
      track('commentary_section_viewed', {
        issueId: issue.issueId,
        lineCount,
      });
    },
    [issue.issueId],
  );

  const onRitualInteract = useCallback(
    (ritualId: string, kind: 'click' | 'hover') => {
      track('ritual_teaser_interacted', {
        issueId: issue.issueId,
        ritualId,
        kind,
      });
    },
    [issue.issueId],
  );

  return (
    <>
      <BackgroundLayers />

      <div className="relative z-10 flex min-h-dvh flex-col">
        <Navbar />

        <main className="flex flex-1 flex-col gap-14 pb-4 lg:gap-20 lg:pb-6">
          <IndexHeader issue={issue} />
          <HeroMetricRail metrics={issue.headlineMetrics} />
          <ClassificationMoversTable
            rows={issue.classifications}
            issueId={issue.issueId}
            onRowOpened={onRowOpened}
          />
          <FeaturedArtifactCard featured={issue.featured} onOpen={onFeaturedOpened} />
          <BureauCommentary lines={issue.commentary} onMounted={onCommentaryMounted} />
          <RitualTeaser
            rituals={issue.rituals}
            notes={issue.archivalNotes}
            onInteract={onRitualInteract}
          />
        </main>

        <FooterLoreStrip />
      </div>
    </>
  );
};
