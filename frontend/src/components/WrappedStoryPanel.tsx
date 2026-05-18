'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import type { FC } from 'react';
import type { WrappedStoryPanel as WrappedStoryPanelData } from '@/lib/fart-wrapped';

interface WrappedStoryPanelProps {
  panel: WrappedStoryPanelData;
  position: number;
  onOpen: (panel: WrappedStoryPanelData) => void;
  onHover: (panel: WrappedStoryPanelData) => void;
}

const EASE = [0.22, 0.61, 0.36, 1] as const;

/**
 * A single "chapter" card in the Fart Wrapped sequence.
 *
 * Shape is consistent across all six story panels:
 *
 *   [CHAPTER · NN · LABEL]
 *   [VALUE]  [UNIT]            <— optional large value strip
 *   [HEADLINE — display font]
 *   [BODY — editorial paragraph]
 *   [DETAIL LABEL · DETAIL VALUE]
 *   [Open dossier →]           <— only when panel.variantId is set
 *
 * Each panel sits on its own bordered card with a brass entry rule that
 * animates in on hover, mirroring the OfferCard treatment used on /premium
 * so the whole product reads as one institution.
 */
export const WrappedStoryPanel: FC<WrappedStoryPanelProps> = ({
  panel,
  position,
  onOpen,
  onHover,
}) => {
  const dossierHref = panel.variantId
    ? `/report?variant=${encodeURIComponent(panel.variantId)}&from=fart-wrapped`
    : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE, delay: 0.05 * position }}
      onPointerEnter={() => onHover(panel)}
      onFocus={() => onHover(panel)}
      className={[
        'group/story relative flex flex-col gap-5 rounded-md border border-[var(--border-stark)]',
        'bg-[var(--bg-panel)] p-7',
        'shadow-[0_20px_50px_-30px_color-mix(in_oklab,black_60%,transparent)]',
      ].join(' ')}
    >
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px scale-x-0 origin-left bg-[var(--accent-brass)] transition-transform duration-500 group-hover/story:scale-x-100"
      />

      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-dashed border-[var(--border-subtle)] pb-3">
        <div className="flex items-center gap-2 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
          <span aria-hidden="true" className="brand-rule h-px w-5 opacity-90" />
          <span>{panel.code}</span>
        </div>
        <span className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
          {panel.label}
        </span>
      </header>

      {panel.value ? (
        <div className="flex items-baseline gap-3">
          <span
            className="font-display text-[var(--text-strong)]"
            style={{
              fontSize: 'clamp(2rem, 5vw, 2.8rem)',
              lineHeight: 0.95,
              fontWeight: 500,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {panel.value}
          </span>
          {panel.unit ? (
            <span className="font-mono text-[0.65rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
              {panel.unit}
            </span>
          ) : null}
        </div>
      ) : null}

      <h3
        className={[
          'font-display tracking-tight text-[var(--text-strong)]',
          panel.value ? 'text-[1.4rem] sm:text-[1.55rem]' : 'text-[1.7rem] sm:text-[1.95rem]',
          'leading-[1.1]',
        ].join(' ')}
      >
        {panel.headline}
      </h3>

      <p className="text-[0.95rem] leading-relaxed text-[var(--text-default)]">{panel.body}</p>

      {panel.detail ? (
        <div className="mt-auto border-t border-dashed border-[var(--border-subtle)] pt-3">
          <div className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
            {panel.detail.label}
          </div>
          <div className="mt-0.5 text-[0.9rem] leading-snug text-[var(--text-default)]">
            {panel.detail.value}
          </div>
        </div>
      ) : null}

      {dossierHref ? (
        <Link
          href={dossierHref}
          onClick={() => onOpen(panel)}
          className={[
            'inline-flex h-7 items-center justify-center gap-1.5 rounded-sm border border-[var(--border-brass)]',
            'bg-[color-mix(in_oklab,var(--accent-brass)_8%,transparent)] px-3 self-start',
            'font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--accent-brass)]',
            'transition-colors hover:bg-[color-mix(in_oklab,var(--accent-brass)_18%,transparent)]',
          ].join(' ')}
        >
          OPEN DOSSIER
          <Arrow />
        </Link>
      ) : null}
    </motion.article>
  );
};

const Arrow: FC = () => (
  <svg width="10" height="10" viewBox="0 0 14 14" aria-hidden="true">
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
