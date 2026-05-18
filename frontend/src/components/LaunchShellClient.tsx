'use client';

import { useCallback, useEffect, useRef, type FC } from 'react';
import { BackgroundLayers } from '@/components/BackgroundLayers';
import { EarlyAccessPanel } from '@/components/EarlyAccessPanel';
import { FooterLoreStrip } from '@/components/FooterLoreStrip';
import { LaunchHero } from '@/components/LaunchHero';
import { Navbar } from '@/components/Navbar';
import { PressStrip } from '@/components/PressStrip';
import { RegulatoryNotice } from '@/components/RegulatoryNotice';
import { ReleaseBulletin } from '@/components/ReleaseBulletin';
import { SampleArtifactPreview } from '@/components/SampleArtifactPreview';
import { pageView, track } from '@/lib/analytics';
import { LAUNCH_MODE } from '@/lib/launch-mode';
import { readWaitlistSubmission, type WaitlistSubmission } from '@/lib/waitlist';

interface LaunchShellClientProps {
  /** Which route mounted us — informs the `launch_view.surface` event. */
  surface: 'home' | 'launch';
}

const EARLY_ACCESS_ANCHOR_ID = 'early-access';
const EARLY_ACCESS_HREF = `#${EARLY_ACCESS_ANCHOR_ID}`;
const FILING_NUMBER = 'PR-MMXXVI-00081';
const RELEASE_STATUS = 'PRIVATE BETA · WIDENING';
const SAMPLE_VARIANT_FALLBACK = 'velvet_foghorn';

/**
 * Top-level orchestrator for the pre-launch shell.
 *
 * Owns:
 *   - Page-level analytics: launch_view (once), release_notice_viewed (once).
 *   - Per-component analytics: waitlist CTA clicks, sample report opens,
 *     founding-badge hover/click, request → submitted funnel.
 *   - Anchor wiring between hero/footer CTAs and the form section.
 *
 * Composition order matches the strategic narrative:
 *
 *   §I    LaunchHero            "opening to the public" + dual CTA
 *   §II   RegulatoryNotice      filing band + bureau departments
 *   §III  SampleArtifactPreview blurred dossier + reveal CTA
 *   §IV   EarlyAccessPanel      form + founding badge
 *   §V    ReleaseBulletin       countdown + deployment ladder
 *   §VI   PressStrip            press lines + embargo packet
 */
export const LaunchShellClient: FC<LaunchShellClientProps> = ({ surface }) => {
  const fired = useRef(false);

  // launch_view + release_notice_viewed (both once on mount).
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    const prior = readWaitlistSubmission();
    pageView('launch_view', {
      surface,
      mode: LAUNCH_MODE ? 'launch' : 'live',
      hasPriorSubmission: prior !== null,
    });
    track('release_notice_viewed', {
      filingNumber: FILING_NUMBER,
      releaseStatus: RELEASE_STATUS,
    });
  }, [surface]);

  // — Hero CTAs —
  const onHeroEarlyAccessClick = useCallback(() => {
    track('waitlist_cta_clicked', { location: 'hero_primary' });
  }, []);
  const onHeroSampleClick = useCallback(() => {
    track('waitlist_cta_clicked', { location: 'hero_secondary' });
    track('sample_report_opened', {
      variantId: SAMPLE_VARIANT_FALLBACK,
      location: 'hero_secondary',
    });
  }, []);

  // — Sample artifact —
  const onOpenSample = useCallback((variantId: string) => {
    track('sample_report_opened', { variantId, location: 'sample_preview' });
  }, []);

  // — Early-access form —
  const onPanelRequest = useCallback(
    (input: { hasName: boolean; hasEmail: boolean; hasFartName: boolean }) => {
      track('waitlist_cta_clicked', { location: 'panel_focus' });
      track('early_access_requested', input);
    },
    [],
  );
  const onPanelSubmitted = useCallback((record: WaitlistSubmission) => {
    track('waitlist_submitted', {
      founderNumber: record.founderNumber,
      hasName: record.name.length > 0,
      hasEmail: record.email.length > 0,
      hasFartName: record.fartName.length > 0,
    });
  }, []);
  const onBadgeInteracted = useCallback(
    (kind: 'hover' | 'click', hasFounderNumber: boolean) => {
      track('founding_badge_interacted', { kind, hasFounderNumber });
    },
    [],
  );

  // — Bulletin / press footer —
  const onBulletinRequestAccess = useCallback(() => {
    track('waitlist_cta_clicked', { location: 'bulletin' });
  }, []);
  const onPressCtaClick = useCallback(() => {
    track('waitlist_cta_clicked', { location: 'press_strip' });
  }, []);

  return (
    <>
      <BackgroundLayers />

      <div className="relative z-10 flex min-h-dvh flex-col">
        <Navbar />

        <main className="flex flex-1 flex-col gap-16 pb-20 lg:gap-24 lg:pb-28">
          <LaunchHero
            earlyAccessAnchor={EARLY_ACCESS_HREF}
            sampleHref={`/report?variant=${encodeURIComponent(SAMPLE_VARIANT_FALLBACK)}&from=launch`}
            onRequestEarlyAccessClick={onHeroEarlyAccessClick}
            onSampleReportClick={onHeroSampleClick}
          />
          <RegulatoryNotice filingNumber={FILING_NUMBER} releaseStatus={RELEASE_STATUS} />
          <SampleArtifactPreview onOpenSample={onOpenSample} />
          <EarlyAccessPanel
            anchorId={EARLY_ACCESS_ANCHOR_ID}
            onRequest={onPanelRequest}
            onSubmitted={onPanelSubmitted}
            onBadgeInteracted={onBadgeInteracted}
          />
          <ReleaseBulletin onRequestAccessClick={onBulletinRequestAccess} />
          <PressStrip onPressCtaClick={onPressCtaClick} />
        </main>

        <FooterLoreStrip />
      </div>
    </>
  );
};
