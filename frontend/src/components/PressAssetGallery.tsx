'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import type { FC, ReactNode } from 'react';
import { Chip } from '@/components/Chip';
import { CopyButton } from '@/components/CopyButton';
import { Seal } from '@/components/Seal';
import { Waveform } from '@/components/Waveform';
import { PRESS_ASSETS, type PressAsset } from '@/lib/press';

interface PressAssetGalleryProps {
  onAssetOpened: (asset: PressAsset, method: 'click' | 'copy_ref') => void;
}

const EASE = [0.22, 0.61, 0.36, 1] as const;

/**
 * Sample asset gallery, framed like the exhibit list at the back of a
 * press kit.
 *
 * Four assets — dossier, share card, challenge notice, public feed —
 * are rendered as compact "exhibit" thumbnails with the
 * same outer frame:
 *
 *   [EXHIBIT A · DOSSIER]                       [aspect ratio · type code]
 *   [ thumbnail ]
 *   caption sentence
 *   [Open press asset]   [Copy reference]
 *
 * The thumbnails are deliberately *stylised representations* of each
 * artifact rather than scaled-down clones — they need to read at small
 * size and remain visually distinct from one another. A journalist
 * clicking "Open press asset" lands on the canonical live surface for
 * the real thing.
 */
export const PressAssetGallery: FC<PressAssetGalleryProps> = ({ onAssetOpened }) => (
  <motion.section
    id="assets"
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.55, ease: EASE }}
    className="mx-auto w-full max-w-7xl px-6 lg:px-10"
  >
    <header className="mb-6 flex flex-wrap items-center gap-3 font-mono text-[0.65rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
      <span aria-hidden="true" className="brand-rule h-px w-8 opacity-90" />
      <span className="rounded-sm border border-[var(--border-brass)] px-1.5 py-px text-[0.6rem]">
        §IV
      </span>
      <span>SAMPLE ASSETS · EXHIBIT LIST</span>
      <span aria-hidden="true" className="brand-rule h-px flex-1 opacity-40" />
      <span className="hidden font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)] md:inline">
        PRESS-FACING SELECTION · 4 EXHIBITS
      </span>
    </header>

    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {PRESS_ASSETS.map((asset, i) => (
        <AssetCard
          key={asset.id}
          asset={asset}
          position={i}
          onAssetOpened={onAssetOpened}
        />
      ))}
    </div>
  </motion.section>
);

interface AssetCardProps {
  asset: PressAsset;
  position: number;
  onAssetOpened: (asset: PressAsset, method: 'click' | 'copy_ref') => void;
}

const AssetCard: FC<AssetCardProps> = ({ asset, position, onAssetOpened }) => (
  <motion.article
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45, ease: EASE, delay: 0.05 * position }}
    className={[
      'group/asset relative flex flex-col gap-5 rounded-md border border-[var(--border-stark)] bg-[var(--bg-panel)] p-6',
      'shadow-[0_20px_50px_-30px_color-mix(in_oklab,black_60%,transparent)]',
    ].join(' ')}
  >
    {/* — Asset header — */}
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
          <span aria-hidden="true" className="brand-rule h-px w-5 opacity-90" />
          <span>{asset.exhibit}</span>
          <span aria-hidden="true" className="h-3 w-px bg-[var(--border-subtle)]" />
          <span>{assetTypeLabel(asset.type)}</span>
        </div>
        <h3 className="mt-2 font-display text-xl leading-tight tracking-tight text-[var(--text-strong)]">
          {asset.name}
        </h3>
      </div>
      <div className="flex flex-col items-end gap-1">
        <Chip tone="brass">{asset.aspect}</Chip>
        <span className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
          PRESS USE
        </span>
      </div>
    </div>

    {/* — Thumbnail surface — */}
    <div
      className="relative overflow-hidden rounded-md border border-[var(--border-subtle)] bg-[var(--bg-panel-strong)]"
      style={{ aspectRatio: asset.aspect }}
    >
      <AssetThumbnail asset={asset} />
    </div>

    {/* — Caption — */}
    <p className="text-[0.9rem] leading-snug text-[var(--text-default)]">{asset.caption}</p>

    {/* — Reference + actions — */}
    <div className="mt-auto flex flex-col gap-3 border-t border-[var(--border-subtle)] pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
        REF · <span className="text-[var(--text-default)]">{asset.reference}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <CopyButton
          text={`${asset.exhibit} · ${asset.name} · ${asset.reference} · ${asset.liveUrl}`}
          onCopy={() => onAssetOpened(asset, 'copy_ref')}
        >
          COPY REFERENCE
        </CopyButton>
        <Link
          href={asset.liveUrl}
          onClick={() => onAssetOpened(asset, 'click')}
          className={[
            'group/open inline-flex h-7 items-center gap-1.5 rounded-sm border border-[var(--border-brass)]',
            'bg-[color-mix(in_oklab,var(--accent-brass)_10%,transparent)] px-3',
            'font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--accent-brass)]',
            'transition-colors hover:bg-[color-mix(in_oklab,var(--accent-brass)_18%,transparent)]',
          ].join(' ')}
        >
          OPEN PRESS ASSET
          <Arrow />
        </Link>
      </div>
    </div>
  </motion.article>
);

function assetTypeLabel(type: PressAsset['type']): string {
  switch (type) {
    case 'dossier':
      return 'DOSSIER · /report';
    case 'share_card':
      return 'SHARE CARD · /share';
    case 'challenge_notice':
      return 'CHALLENGE · /challenge';
    case 'public_feed':
      return 'PUBLIC FEED · /feed';
  }
}

// ---------------------------------------------------------------------------
// Per-asset thumbnails
// ---------------------------------------------------------------------------

const AssetThumbnail: FC<{ asset: PressAsset }> = ({ asset }) => {
  switch (asset.type) {
    case 'dossier':
      return <DossierThumb />;
    case 'share_card':
      return <ShareCardThumb />;
    case 'challenge_notice':
      return <ChallengeNoticeThumb />;
    case 'public_feed':
      return <PublicFeedThumb />;
  }
};

/** Compact dossier still — horizontal 16:11. */
const DossierThumb: FC = () => (
  <ThumbFrame label="CASE FILE · BAG-2026-04412">
    <div className="grid grid-cols-[1fr_auto] items-start gap-4 px-5 pt-5">
      <div className="min-w-0">
        <div className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
          CLASSIFICATION
        </div>
        <div className="mt-1 truncate font-display text-2xl leading-tight tracking-tight text-[var(--text-strong)]">
          Velvet Foghorn
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Chip tone="amber" withDot>
            AMBER · 73
          </Chip>
          <Chip tone="brass">DURATION · 2.94s</Chip>
        </div>
      </div>
      <div className="text-[var(--accent-brass)]">
        <Seal size={56} className="opacity-90" />
      </div>
    </div>
    <div className="px-5 pt-4">
      <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--bg-panel-strong)]">
        <div className="h-full w-[73%] rounded-full bg-[var(--accent-brass)]" />
      </div>
      <div className="mt-3 -mx-1">
        <Waveform bars={36} />
      </div>
    </div>
    <ThumbFooter
      left="HASH · fart_8c1d4a92ef6b7a5d"
      right="ISSUED · 2026-05-17 UTC"
    />
  </ThumbFrame>
);

/** Vertical 9:16 share-card still. */
const ShareCardThumb: FC = () => (
  <div className="absolute inset-0 flex flex-col bg-[var(--bg-panel)] px-4 py-4">
    <div className="flex items-center justify-between">
      <span className="font-mono text-[0.5rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
        BUREAU
      </span>
      <span className="font-mono text-[0.5rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
        9 · 16
      </span>
    </div>
    <div className="mt-3 flex-1 rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-panel-strong)] p-3">
      <div className="font-mono text-[0.5rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
        CLASSIFICATION
      </div>
      <div
        className="mt-1 font-display leading-[0.9] tracking-tight text-[var(--text-strong)]"
        style={{ fontSize: 'clamp(1rem, 4vw, 1.6rem)', fontWeight: 500 }}
      >
        Velvet
        <br />
        Foghorn
      </div>
      <div className="mt-3 font-mono text-[0.5rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
        SCORE
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="font-display text-2xl leading-none text-[var(--text-strong)]">73</span>
        <span className="font-mono text-[0.5rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
          / 100
        </span>
      </div>
      <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-[var(--bg-panel)]">
        <div className="h-full w-[73%] rounded-full bg-[var(--accent-brass)]" />
      </div>
      <div className="mt-4 -mx-1">
        <Waveform bars={18} />
      </div>
    </div>
    <div className="mt-3 flex items-center justify-between font-mono text-[0.45rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
      <span>HASH · fart_8c…</span>
      <span>VERT · 1080</span>
    </div>
  </div>
);

/** Challenge notice still — split scoreboard. */
const ChallengeNoticeThumb: FC = () => (
  <ThumbFrame label="DISPUTE FILED · CHL-MMXXVI">
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-5 py-5">
      <div className="text-right">
        <div className="font-mono text-[0.5rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
          CHALLENGER
        </div>
        <div className="font-display text-3xl leading-none text-[var(--text-strong)]">73</div>
        <div className="mt-1 font-mono text-[0.5rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
          VELVET FOGHORN
        </div>
      </div>
      <div className="flex flex-col items-center gap-1">
        <span className="font-display italic text-[1.05rem] text-[var(--accent-brass)]">vs</span>
        <span
          aria-hidden="true"
          className="h-10 w-px bg-[var(--border-stark)] opacity-90"
        />
      </div>
      <div>
        <div className="font-mono text-[0.5rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
          RECIPIENT
        </div>
        <div className="font-display text-3xl leading-none text-[var(--text-faint)]">??</div>
        <div className="mt-1 font-mono text-[0.5rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
          PENDING FILE
        </div>
      </div>
    </div>
    <div className="border-t border-[var(--border-subtle)] px-5 pt-3 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
      ARTIFACT IN DISPUTE · BEAT-SCORE PROVISION
    </div>
    <ThumbFooter
      left="CHL · CHL-04412-VF"
      right="SURFACE · /share"
    />
  </ThumbFrame>
);

/** Public feed still — ranked gallery grid. */
const PublicFeedThumb: FC = () => (
  <ThumbFrame label="PUBLIC FEED · MODERATED">
    <div className="grid grid-cols-2 gap-2 px-5 py-5">
      {[
        { name: 'Velvet Foghorn', score: 73, tone: 'amber' as const },
        { name: 'Brass Kettle', score: 61, tone: 'brass' as const },
        { name: 'Silent Assassin', score: 88, tone: 'green' as const },
        { name: 'Cerulean Drift', score: 54, tone: 'cerulean' as const },
      ].map((row) => (
        <div
          key={row.name}
          className="rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-panel-strong)] px-3 py-2"
        >
          <div className="truncate font-display text-sm leading-tight text-[var(--text-strong)]">
            {row.name}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <Chip tone={row.tone}>{row.score}</Chip>
            <span className="font-mono text-[0.45rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
              OPT-IN
            </span>
          </div>
        </div>
      ))}
    </div>
    <ThumbFooter left="FEED · ranked by score" right="SURFACE · /feed" />
  </ThumbFrame>
);

// ---------------------------------------------------------------------------
// Shared chrome
// ---------------------------------------------------------------------------

const ThumbFrame: FC<{ label: string; children: ReactNode }> = ({ label, children }) => (
  <div className="absolute inset-0 flex flex-col">
    <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] bg-[var(--bg-panel-strong)] px-5 py-2 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
      <span aria-hidden="true" className="brand-rule h-px w-4 opacity-90" />
      {label}
    </div>
    <div className="relative flex-1">
      {children}
    </div>
  </div>
);

const ThumbFooter: FC<{ left: string; right: string }> = ({ left, right }) => (
  <div className="mt-auto flex items-center justify-between gap-3 border-t border-[var(--border-subtle)] bg-[var(--bg-panel-strong)] px-5 py-2 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
    <span>{left}</span>
    <span>{right}</span>
  </div>
);

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
