'use client';

import { motion } from 'framer-motion';
import type { FC } from 'react';
import { Chip } from '@/components/Chip';
import type { PremiumSourceSurface } from '@/lib/premium';
import { fileNumberForVariant } from '@/lib/premium';
import type { ResultVariant } from '@/lib/result-variants';

interface PremiumNoticeProps {
  variant: ResultVariant;
  source: PremiumSourceSurface;
}

const EASE = [0.22, 0.61, 0.36, 1] as const;

/**
 * Hero block for /premium.
 *
 * Tone is set by the eyebrow + chips on the right edge: this is a
 * "Bureau Certification Services" surface, not a checkout. The page leans
 * into archival language ("filed under §4.2", "issued at Station OPS-04")
 * so the upsell reads as a formal upgrade rather than an e-commerce step.
 *
 * Source-surface awareness: the right-rail chip changes to reflect where
 * the user came from. It's purely informational but keeps the page from
 * feeling teleported-into when the user clicked from /report or /share.
 */
export const PremiumNotice: FC<PremiumNoticeProps> = ({ variant, source }) => {
  const fileNumber = fileNumberForVariant(variant.id);
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: EASE }}
      className="mx-auto w-full max-w-7xl px-6 pt-8 lg:px-10 lg:pt-12"
    >
      {/* — Top ledger strip — */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-dashed border-[var(--border-stark)] bg-[color-mix(in_oklab,var(--bg-panel-strong)_85%,transparent)] px-4 py-3">
        <div className="flex items-center gap-3 font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
          <span aria-hidden="true" className="brand-rule h-px w-6 opacity-90" />
          <span className="text-[var(--accent-brass)]">BUREAU CERTIFICATION SERVICES</span>
          <span aria-hidden="true" className="hidden h-3 w-px bg-[var(--border-stark)] md:inline-block" />
          <span className="hidden md:inline">Archival-grade issue formats.</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone="brass">{fileNumber}</Chip>
          <Chip tone="amber" withDot>
            EARLY ACCESS
          </Chip>
          {source === 'report' ? <Chip tone="neutral">FROM · DOSSIER</Chip> : null}
          {source === 'share' ? <Chip tone="neutral">FROM · SHARE CARD</Chip> : null}
          {source === 'challenge' ? <Chip tone="neutral">FROM · CHALLENGE</Chip> : null}
        </div>
      </div>

      {/* — Title — */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
        <div>
          <div className="flex items-center gap-3 font-mono text-[0.62rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
            <span aria-hidden="true" className="brand-rule h-px w-8 opacity-90" />
            <span className="rounded-sm border border-[var(--border-brass)] px-1.5 py-px text-[0.6rem]">
              §08
            </span>
            <span>OFFICIAL CERTIFICATION SERVICES · ACOUSTIC RECORDS</span>
          </div>
          <h1
            className={[
              'mt-4 max-w-[22ch] font-display font-medium leading-[1.02] tracking-tight',
              'text-[var(--text-strong)] text-shadow-glow',
              'text-[2.4rem] sm:text-[3rem] md:text-[3.6rem] lg:text-[4rem]',
            ].join(' ')}
          >
            An <span className="italic text-[var(--accent-brass)]">official issue</span> of your dossier.
          </h1>
          <p className="mt-5 max-w-[56ch] text-[0.95rem] leading-relaxed text-[var(--text-default)]">
            Promote{' '}
            <span className="text-[var(--text-strong)]">{variant.classification}</span> from a
            routine acoustic incident to a permanent administrative object. Archival formatting,
            ceremonial watermark, and a serialised filing number. Printable for display, gifting,
            or internal review.
          </p>
        </div>

        {/* Pull-quotes panel — the brand voice up front */}
        <ul className="grid grid-cols-1 gap-2 rounded-md border border-[var(--border-brass)] bg-[color-mix(in_oklab,var(--accent-brass)_6%,transparent)] p-5 font-display italic">
          {PREMIUM_LINES.map((line) => (
            <li
              key={line}
              className={[
                'text-[1.05rem] leading-snug text-[var(--text-strong)]',
                'before:mr-2 before:font-mono before:text-[0.55rem] before:not-italic before:uppercase before:tracking-wide-3 before:text-[var(--accent-brass)]',
                'before:content-["§"]',
              ].join(' ')}
            >
              {line}
            </li>
          ))}
        </ul>
      </div>
    </motion.section>
  );
};

const PREMIUM_LINES = [
  'For events of documented significance.',
  'Suitable for framing.',
  'Recognised nowhere, respected everywhere.',
] as const;
