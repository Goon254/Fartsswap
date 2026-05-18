'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useCallback, useEffect, useRef, type FC } from 'react';
import { BackgroundLayers } from '@/components/BackgroundLayers';
import { Button } from '@/components/Button';
import { CertificateSpecList } from '@/components/CertificateSpecList';
import { Chip } from '@/components/Chip';
import { FooterLoreStrip } from '@/components/FooterLoreStrip';
import { Navbar } from '@/components/Navbar';
import { OfferCard } from '@/components/OfferCard';
import { PremiumArtifactPreview } from '@/components/PremiumArtifactPreview';
import { PremiumNotice } from '@/components/PremiumNotice';
import { pageView, track } from '@/lib/analytics';
import { listOffers, type PremiumOffer, type PremiumSourceSurface } from '@/lib/premium';
import type { ResultVariant } from '@/lib/result-variants';

interface PremiumFlowClientProps {
  variant: ResultVariant;
  source: PremiumSourceSurface;
}

const EASE = [0.22, 0.61, 0.36, 1] as const;

/**
 * /premium client orchestrator.
 *
 * Owns the page-level analytics surface and threads variant + source
 * context down into the four presentation components.
 *
 * Composition (top-to-bottom):
 *   <PremiumNotice>          archive-office hero + brand-voice pull-quotes
 *   <PremiumArtifactPreview> three sample issues (PDF / wall / theme pack)
 *   §10 · OFFER LEDGER       grid of OfferCards
 *   §11 · CERTIFICATE SPEC   CertificateSpecList breakdown
 *   §12 · FOOTER CTA         join early access + back to dossier
 */
export function PremiumFlowClient({ variant, source }: PremiumFlowClientProps) {
  const reportHref = `/report?variant=${encodeURIComponent(variant.id)}`;
  const offers = listOffers();

  // Page-view + per-offer view events fire once on mount.
  const viewedRef = useRef(false);
  useEffect(() => {
    if (viewedRef.current) return;
    viewedRef.current = true;
    pageView('premium_view', { variantId: variant.id, sourceSurface: source });
    offers.forEach((offer, position) => {
      track('premium_offer_viewed', {
        offerId: offer.id,
        offerType: offer.type,
        variantId: variant.id,
        position,
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSelect = useCallback(
    (offer: PremiumOffer) => {
      track('premium_offer_selected', {
        offerId: offer.id,
        offerType: offer.type,
        variantId: variant.id,
      });
      track('premium_cta_clicked', {
        variantId: variant.id,
        location: 'offer_card',
        sourceSurface: 'premium',
      });
    },
    [variant.id],
  );

  const onPreviewInteracted = useCallback(
    (previewType: 'pdf_certificate' | 'wall_certificate' | 'theme_pack') => {
      track('premium_preview_interacted', { variantId: variant.id, previewType });
    },
    [variant.id],
  );

  const onBackClick = useCallback(() => {
    track('premium_back_to_report_clicked', { variantId: variant.id });
  }, [variant.id]);

  const onFooterCtaClick = useCallback(() => {
    track('premium_cta_clicked', {
      variantId: variant.id,
      location: 'premium_footer',
      sourceSurface: 'premium',
    });
  }, [variant.id]);

  return (
    <>
      <BackgroundLayers />
      <div className="relative z-10 flex min-h-dvh flex-col">
        <Navbar />

        <PremiumNotice variant={variant} source={source} />
        <PremiumArtifactPreview variant={variant} onPreviewInteracted={onPreviewInteracted} />

        {/* — §10 · OFFER LEDGER — */}
        <section className="mx-auto w-full max-w-7xl px-6 pt-14 lg:px-10 lg:pt-20">
          <div className="mb-6 flex items-center gap-3">
            <span aria-hidden="true" className="brand-rule h-px w-8 opacity-90" />
            <span className="rounded-sm border border-[var(--border-brass)] px-1.5 py-px font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
              §10
            </span>
            <span className="font-mono text-[0.65rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
              OFFER LEDGER · ACTIVE INSTRUMENTS
            </span>
            <span aria-hidden="true" className="brand-rule h-px flex-1 opacity-40" />
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {offers.map((offer, i) => (
              <OfferCard key={offer.id} offer={offer} onSelect={onSelect} position={i} />
            ))}
          </div>
        </section>

        {/* — §11 · CERTIFICATE SPEC — */}
        <section className="mx-auto w-full max-w-7xl px-6 pt-14 lg:px-10 lg:pt-20">
          <div className="mb-6 flex items-center gap-3">
            <span aria-hidden="true" className="brand-rule h-px w-8 opacity-90" />
            <span className="rounded-sm border border-[var(--border-brass)] px-1.5 py-px font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
              §11
            </span>
            <span className="font-mono text-[0.65rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
              CERTIFICATE SPECIFICATION · PDF
            </span>
            <span aria-hidden="true" className="brand-rule h-px flex-1 opacity-40" />
          </div>
          <CertificateSpecList />
        </section>

        {/* — §12 · FOOTER CTA — */}
        <FooterCta
          variantId={variant.id}
          reportHref={reportHref}
          onBack={onBackClick}
          onJoin={onFooterCtaClick}
        />

        <FooterLoreStrip />
      </div>
    </>
  );
}

const FooterCta: FC<{
  variantId: string;
  reportHref: string;
  onBack: () => void;
  onJoin: () => void;
}> = ({ reportHref, onBack, onJoin }) => (
  <motion.section
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: EASE, delay: 0.1 }}
    className="mx-auto w-full max-w-7xl px-6 pb-16 pt-14 lg:px-10 lg:pb-24 lg:pt-20"
  >
    <div
      className={[
        'flex flex-col gap-6 rounded-md border border-[var(--border-stark)]',
        'bg-[color-mix(in_oklab,var(--bg-panel)_75%,transparent)] p-7 backdrop-blur-md',
        'md:flex-row md:items-end md:justify-between',
      ].join(' ')}
    >
      <div className="max-w-[40rem]">
        <div className="flex items-center gap-3 font-mono text-[0.62rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
          <span aria-hidden="true" className="brand-rule h-px w-6 opacity-90" />
          <span className="rounded-sm border border-[var(--border-brass)] px-1.5 py-px text-[0.6rem]">
            §12
          </span>
          <span>JOIN EARLY ACCESS</span>
        </div>
        <h2 className="mt-4 font-display text-3xl leading-tight tracking-tight text-[var(--text-strong)] sm:text-4xl">
          The Bureau is taking submissions of intent.
        </h2>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-[var(--text-default)]">
          Reserve your serial. When the certification line opens, the early-access roster ships
          first. No payment is processed today; the queue is honoured strictly in filing order.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Chip tone="brass">NO PAYMENT TODAY</Chip>
          <Chip tone="amber" withDot>
            QUEUE · OPEN
          </Chip>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:items-end">
        <Button variant="primary" onClick={onJoin} trailing={<Arrow />}>
          Join early access
        </Button>
        <Link
          href={reportHref}
          onClick={onBack}
          className="group/back inline-flex items-center gap-2 font-mono text-[0.62rem] uppercase tracking-wide-3 text-[var(--text-muted)] hover:text-[var(--accent-teal)] transition-colors"
        >
          <BackArrow />
          <span>Back to dossier</span>
        </Link>
      </div>
    </div>
  </motion.section>
);

const Arrow: FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
    <path
      d="M1 7h11M8 3l4 4-4 4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
      fill="none"
    />
  </svg>
);

const BackArrow: FC = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
    <path
      d="M11 6 H2 M5 3 L2 6 L5 9"
      stroke="currentColor"
      strokeWidth="1.4"
      fill="none"
      strokeLinecap="square"
      strokeLinejoin="miter"
    />
  </svg>
);

