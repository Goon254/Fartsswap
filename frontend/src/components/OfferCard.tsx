'use client';

import { motion } from 'framer-motion';
import type { FC } from 'react';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import type { PremiumOffer } from '@/lib/premium';

interface OfferCardProps {
  offer: PremiumOffer;
  onSelect: (offer: PremiumOffer) => void;
  /** Used by analytics + the `position` field in `premium_offer_viewed`. */
  position: number;
}

const EASE = [0.22, 0.61, 0.36, 1] as const;

/**
 * One offer in the upsell grid.
 *
 * Treats the offer as a printed product listing rather than a SaaS pricing
 * tile: roman-numeral position, brass divider rule, badge in the top-right,
 * deadpan rationale beneath the description, monospace price strip at the
 * bottom. CTA is a "notify me" / "early access" string until payments land
 * — the `available` flag flips that later without changing the markup.
 *
 * Motion: standard lift on hover. The CTA fires onSelect synchronously so
 * the parent owns the analytics attribution.
 */
export const OfferCard: FC<OfferCardProps> = ({ offer, onSelect, position }) => (
  <motion.article
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45, ease: EASE, delay: 0.05 * position }}
    whileHover={{ y: -3 }}
    className={[
      'group/offer relative flex flex-col gap-5 rounded-md border p-6',
      'bg-[var(--bg-panel)]',
      offer.badge === 'MOST OFFICIAL'
        ? 'border-[var(--border-brass)]'
        : 'border-[var(--border-subtle)]',
      'shadow-[0_20px_50px_-30px_color-mix(in_oklab,black_65%,transparent)]',
    ].join(' ')}
  >
    {/* brass top-rule on hover */}
    <span
      aria-hidden="true"
      className="absolute inset-x-0 top-0 h-px scale-x-0 origin-left bg-[var(--accent-brass)] transition-transform duration-500 group-hover/offer:scale-x-100"
    />

    <div className="flex items-baseline justify-between">
      <span className="font-display text-4xl leading-none tracking-tight text-[var(--accent-brass)] opacity-90">
        {ROMAN[position] ?? `№${position + 1}`}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        {offer.badge ? <Chip tone="brass">{offer.badge}</Chip> : null}
        <Chip tone={offer.available ? 'green' : 'neutral'}>
          {offer.available ? 'AVAILABLE' : 'EARLY ACCESS'}
        </Chip>
      </div>
    </div>

    <div>
      <h3 className="font-display text-2xl leading-tight tracking-tight text-[var(--text-strong)]">
        {offer.name}
      </h3>
      <p className="mt-2 text-[0.95rem] leading-relaxed text-[var(--text-default)]">
        {offer.description}
      </p>
    </div>

    <p className="font-display italic text-[0.95rem] leading-snug text-[var(--text-strong)]">
      {`\u201C${offer.rationale}\u201D`}
    </p>

    <div className="mt-auto flex flex-col gap-3 border-t border-[var(--border-subtle)] pt-4">
      <div className="flex items-center justify-between font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
        <span>PRICE</span>
        <span className="text-[var(--text-strong)]">{offer.priceLabel}</span>
      </div>
      <Button
        variant={offer.badge === 'MOST OFFICIAL' ? 'primary' : 'secondary'}
        onClick={() => onSelect(offer)}
        trailing={<Arrow />}
      >
        {offer.ctaLabel}
      </Button>
      <p className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
        Payments not yet processed. Joins the early-access list only.
      </p>
    </div>
  </motion.article>
);

const ROMAN: Record<number, string> = {
  0: 'I',
  1: 'II',
  2: 'III',
  3: 'IV',
  4: 'V',
  5: 'VI',
};

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
