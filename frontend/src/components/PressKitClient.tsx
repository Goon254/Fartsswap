'use client';

import { motion } from 'framer-motion';
import { useCallback, useEffect, useRef, type FC } from 'react';
import { BackgroundLayers } from '@/components/BackgroundLayers';
import { BoilerplateCard } from '@/components/BoilerplateCard';
import { EmbargoNotice } from '@/components/EmbargoNotice';
import { FooterLoreStrip } from '@/components/FooterLoreStrip';
import { MediaFactGrid } from '@/components/MediaFactGrid';
import { Navbar } from '@/components/Navbar';
import { PressAssetGallery } from '@/components/PressAssetGallery';
import { PressHeader } from '@/components/PressHeader';
import { QuoteBlock } from '@/components/QuoteBlock';
import { ReleaseBody } from '@/components/ReleaseBody';
import { pageView, track } from '@/lib/analytics';
import { type PressAsset, type PressContactKind, type PressQuote } from '@/lib/press';

const EASE = [0.22, 0.61, 0.36, 1] as const;

/**
 * /press orchestrator.
 *
 * Owns:
 *   - The single `press_view` mount event.
 *   - Every cross-section analytics callback so the seven components stay
 *     dumb and reusable.
 *
 * Composition (matches the press-room reading order):
 *
 *   §I    PressHeader        FOR IMMEDIATE RELEASE strip + media contact rail
 *   §II   QuoteBlock         three boilerplate quotes with attribution
 *   §III  MediaFactGrid      eight clipboard-ready facts
 *   §IV   PressAssetGallery  four exhibit thumbnails (live-link + reference)
 *   §V    EmbargoNotice      embargo terms, packets, press desk
 *   §VI   BoilerplateCard    about-the-Bureau closing block
 *
 *   …with a small in-page section nav strip between the header and the
 *   release body so journalists can jump straight to facts or assets.
 */
export const PressKitClient: FC = () => {
  const viewed = useRef(false);
  useEffect(() => {
    if (viewed.current) return;
    viewed.current = true;
    pageView('press_view', {});
  }, []);

  const onContactClick = useCallback((contactType: PressContactKind) => {
    track('press_contact_clicked', { contactType });
  }, []);

  const onQuoteCopied = useCallback((q: PressQuote) => {
    track('press_quote_copied', { quoteId: q.id, role: q.role });
  }, []);

  const onFactInteracted = useCallback(
    (factId: string, kind: 'hover' | 'copy') => {
      track('press_fact_sheet_interacted', { factId, kind });
    },
    [],
  );

  const onAssetOpened = useCallback(
    (asset: PressAsset, method: 'click' | 'copy_ref') => {
      track('press_asset_opened', {
        assetId: asset.id,
        assetType: asset.type,
        method,
      });
    },
    [],
  );

  const onEmbargoMounted = useCallback((embargoIso: string, docket: string) => {
    track('embargo_notice_viewed', { embargoIso, docket });
  }, []);

  return (
    <>
      <BackgroundLayers />

      <div className="relative z-10 flex min-h-dvh flex-col">
        <Navbar />

        <main className="flex flex-1 flex-col gap-14 pb-4 lg:gap-20 lg:pb-6">
          <PressHeader onContactClick={onContactClick} />
          <SectionNav />
          <ReleaseBody />
          <QuoteBlock onQuoteCopied={onQuoteCopied} />
          <MediaFactGrid onFactInteracted={onFactInteracted} />
          <PressAssetGallery onAssetOpened={onAssetOpened} />
          <EmbargoNotice
            onMounted={onEmbargoMounted}
            onContactClick={onContactClick}
          />
          <BoilerplateCard />
        </main>

        <FooterLoreStrip />
      </div>
    </>
  );
};

/**
 * In-page chip nav for journalists. Pure anchor links so the page works
 * with JS off, with a small motion fade on mount.
 */
const SectionNav: FC = () => (
  <motion.nav
    aria-label="Press kit sections"
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: EASE, delay: 0.15 }}
    className="mx-auto w-full max-w-7xl px-6 lg:px-10"
  >
    <ul className="flex flex-wrap items-center gap-2 rounded-md border border-[var(--border-subtle)] bg-[color-mix(in_oklab,var(--bg-panel-strong)_75%,transparent)] px-3 py-2">
      <li className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
        JUMP TO:
      </li>
      {SECTIONS.map((s) => (
        <li key={s.href}>
          <a
            href={s.href}
            className={[
              'inline-flex items-center gap-1.5 rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-panel)]',
              'px-2.5 py-1 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]',
              'transition-colors hover:border-[var(--accent-brass)] hover:text-[var(--accent-brass)]',
            ].join(' ')}
          >
            <span className="text-[var(--accent-brass)]">{s.code}</span>
            <span>{s.label}</span>
          </a>
        </li>
      ))}
    </ul>
  </motion.nav>
);

const SECTIONS = [
  { code: '§I', label: 'Press Release', href: '#release' },
  { code: '§II', label: 'Quotes', href: '#quotes' },
  { code: '§III', label: 'Fact Sheet', href: '#facts' },
  { code: '§IV', label: 'Sample Assets', href: '#assets' },
  { code: '§V', label: 'Embargo', href: '#embargo' },
  { code: '§VI', label: 'Boilerplate', href: '#boilerplate' },
] as const;
