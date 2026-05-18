'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FC } from 'react';
import { BackgroundLayers } from '@/components/BackgroundLayers';
import { BureauCommentary } from '@/components/BureauCommentary';
import { ClassificationMoversTable } from '@/components/ClassificationMoversTable';
import { FeaturedArtifactCard } from '@/components/FeaturedArtifactCard';
import { FooterLoreStrip } from '@/components/FooterLoreStrip';
import { HeroMetricRail } from '@/components/HeroMetricRail';
import { IndexHeader } from '@/components/IndexHeader';
import { Navbar } from '@/components/Navbar';
import { RitualProvenanceStrip } from '@/components/RitualProvenanceStrip';
import { RitualTeaser } from '@/components/RitualTeaser';
import { pageView, track } from '@/lib/analytics';
import { CURRENT_ISSUE, type ClassificationRow, type MethaneIndexIssue } from '@/lib/methane-index';
import { fetchMethaneIndexCurrent, type MethaneIndexEnvelope } from '@/lib/rituals-api';
import { recordSponsorshipAttribution } from '@/lib/sponsorship-api';

/**
 * /methane-index orchestrator.
 *
 * Resolves `MethaneIndexIssue` from the query-backed API when available,
 * otherwise falls back to `CURRENT_ISSUE` without breaking layout.
 */
export const MethaneIndexClient: FC = () => {
  const [envelope, setEnvelope] = useState<MethaneIndexEnvelope | undefined>(undefined);
  const [fetchFailed, setFetchFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await fetchMethaneIndexCurrent();
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
  }, []);

  const provenance = envelope?.provenance ?? 'canonical_fallback';
  const issue: MethaneIndexIssue = envelope?.issue ?? CURRENT_ISSUE;
  const windowLabel = envelope?.window.label;

  const poweredBy = useMemo(() => {
    const p = envelope?.sponsorship?.placements?.find((x) => x.slotCode === 'methane_index_powered_by');
    if (!p) return undefined;
    const line = typeof p.creative.line === 'string' ? p.creative.line : undefined;
    if (!line) return undefined;
    return {
      line,
      disclosure: typeof p.creative.disclosure === 'string' ? p.creative.disclosure : undefined,
      destinationUrl: typeof p.creative.destinationUrl === 'string' ? p.creative.destinationUrl : undefined,
      placementId: p.placementId,
    };
  }, [envelope?.sponsorship?.placements]);

  const viewed = useRef(false);
  const realDataTracked = useRef(false);
  const sponsorshipServedTracked = useRef(false);

  useEffect(() => {
    if (viewed.current) return;
    if (envelope === undefined && !fetchFailed) return;
    viewed.current = true;
    pageView('methane_index_view', {
      issueId: issue.issueId,
      issueNumber: issue.issueNumber,
    });
  }, [issue.issueId, issue.issueNumber, envelope, fetchFailed]);

  useEffect(() => {
    if (realDataTracked.current || !envelope) return;
    if (envelope.provenance !== 'live' && envelope.provenance !== 'low_volume') return;
    if (!envelope.issue) return;
    realDataTracked.current = true;
    void track('methane_index_realdata_view', {
      issueId: envelope.issue.issueId,
      issueNumber: envelope.issue.issueNumber,
      provenance: envelope.provenance,
      windowLabel: envelope.window.label,
    });
    void track('featured_artifact_selected', {
      issueId: envelope.issue.issueId,
      variantId: envelope.issue.featured.variantId,
      reportId: envelope.featuredReportId ?? envelope.issue.featured.reportId,
    });
  }, [envelope]);

  useEffect(() => {
    if (sponsorshipServedTracked.current) return;
    const pl = envelope?.sponsorship?.placements;
    if (!pl || pl.length === 0) return;
    sponsorshipServedTracked.current = true;
    void track('sponsored_inventory_served', {
      surface: 'methane_index',
      slots: pl.map((p) => p.slotCode),
      placementIds: pl.map((p) => p.placementId),
    });
  }, [envelope?.sponsorship?.placements]);

  const onPartnerLinkClick = useCallback(() => {
    if (!poweredBy?.placementId) return;
    void recordSponsorshipAttribution({
      placementId: poweredBy.placementId,
      eventType: 'click',
      metadata: { surface: 'methane_index_powered_by' },
    });
    void track('sponsored_inventory_clicked', {
      surface: 'methane_index',
      slotCode: 'methane_index_powered_by',
      placementId: poweredBy.placementId,
    });
  }, [poweredBy?.placementId]);

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

  const showStrip = useMemo(() => fetchFailed || envelope !== undefined, [fetchFailed, envelope]);

  return (
    <>
      <BackgroundLayers />

      <div className="relative z-10 flex min-h-dvh flex-col">
        <Navbar />

        <main className="flex flex-1 flex-col gap-14 pb-4 lg:gap-20 lg:pb-6">
          {showStrip ? (
            <div className="pt-4">
              <RitualProvenanceStrip
                surface="methane"
                provenance={provenance}
                fetchFailed={fetchFailed}
                windowLabel={windowLabel}
              />
            </div>
          ) : null}
          <IndexHeader issue={issue} poweredBy={poweredBy} onPartnerLinkClick={onPartnerLinkClick} />
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
