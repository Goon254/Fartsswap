'use client';

import Link from 'next/link';
import type { FC } from 'react';
import { Chip } from '@/components/Chip';
import { CopyButton } from '@/components/CopyButton';
import { PanelFrame } from '@/components/SeedIntakePanel';
import type { ResultVariant } from '@/lib/result-variants';
import {
  generateOutreachCopy,
  type SeedPayload,
  type SeedSurface,
} from '@/lib/seed';

interface GeneratedLink {
  surface: SeedSurface;
  /** Display label, e.g. "Dossier · /report". */
  title: string;
  /** Section code shown in the eyebrow. */
  index: string;
  /** Fully-composed URL the operator copies. */
  href: string;
  /** Caption the operator can hand to a creator. */
  pitch: string;
}

interface SeedLinkPanelProps {
  variant: ResultVariant;
  payload: SeedPayload;
  toggles: Record<SeedSurface, boolean>;
  /** href builders are owned by the orchestrator so they stay in lockstep with the toggles. */
  hrefs: Record<SeedSurface, string>;
  onLinkCopied: (surface: SeedSurface, kind: 'url' | 'pitch') => void;
  onPreviewOpened: (surface: SeedSurface, variantId: string) => void;
}

const SURFACE_META: Record<
  SeedSurface,
  { title: string; index: string; eyebrow: string }
> = {
  report: {
    title: 'Dossier · /report',
    index: 'L1',
    eyebrow: 'FULL DIAGNOSTIC SURFACE',
  },
  share: {
    title: 'Share card · /share',
    index: 'L2',
    eyebrow: 'VERTICAL 9:16 POSTER · SCREENSHOT-NATIVE',
  },
  challenge: {
    title: 'Challenge notice · /challenge',
    index: 'L3',
    eyebrow: 'SEND-TO-FRIEND DISPUTE',
  },
};

/**
 * §V — Generated links + outreach captions.
 *
 * Renders one card per enabled output surface. Each card carries:
 *
 *   - A surface eyebrow + title
 *   - The full URL displayed in a monospace strip (truncates with
 *     overflow-x:auto so the operator can scrub the tail)
 *   - A "Copy URL" button via the shared CopyButton component
 *   - The platform-aware pitch caption in a quote-style block
 *   - A "Copy pitch" button
 *   - An "Open preview" link that opens the live URL in a new tab
 *
 * Analytics:
 *   - `onLinkCopied(surface, 'url' | 'pitch')` fires after each Copy.
 *   - `onPreviewOpened(surface, variantId)` fires before the new-tab nav.
 */
export const SeedLinkPanel: FC<SeedLinkPanelProps> = ({
  variant,
  payload,
  toggles,
  hrefs,
  onLinkCopied,
  onPreviewOpened,
}) => {
  const generated: GeneratedLink[] = (Object.keys(SURFACE_META) as SeedSurface[])
    .filter((s) => toggles[s])
    .map((s) => ({
      surface: s,
      title: SURFACE_META[s].title,
      index: SURFACE_META[s].index,
      href: hrefs[s],
      pitch: generateOutreachCopy(payload, variant, s),
    }));

  return (
    <PanelFrame index="§V" code="DISTRIBUTION PACKET" title="Generated links">
      {generated.length === 0 ? (
        <div className="rounded-sm border border-dashed border-[var(--border-stark)] bg-[var(--bg-panel-strong)] px-4 py-6 text-center">
          <div className="font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
            NO SURFACE PREPARED
          </div>
          <div className="mt-2 text-[0.9rem] text-[var(--text-default)]">
            Enable at least one output surface in §III to generate a distribution packet.
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {generated.map((g) => (
            <li key={g.surface}>
              <LinkCard
                generated={g}
                variantId={variant.id}
                onLinkCopied={onLinkCopied}
                onPreviewOpened={onPreviewOpened}
              />
            </li>
          ))}
        </ul>
      )}
    </PanelFrame>
  );
};

interface LinkCardProps {
  generated: GeneratedLink;
  variantId: string;
  onLinkCopied: (surface: SeedSurface, kind: 'url' | 'pitch') => void;
  onPreviewOpened: (surface: SeedSurface, variantId: string) => void;
}

const LinkCard: FC<LinkCardProps> = ({ generated, variantId, onLinkCopied, onPreviewOpened }) => (
  <article
    className={[
      'group/link rounded-sm border border-[var(--border-stark)] bg-[var(--bg-panel)] p-5',
      'shadow-[0_10px_30px_-20px_color-mix(in_oklab,black_60%,transparent)]',
    ].join(' ')}
  >
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-dashed border-[var(--border-subtle)] pb-3">
      <div className="flex items-center gap-2 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
        <span aria-hidden="true" className="brand-rule h-px w-5 opacity-90" />
        <span className="rounded-sm border border-[var(--border-brass)] px-1.5 py-px text-[0.5rem]">
          {generated.index}
        </span>
        <span>{SURFACE_META[generated.surface].eyebrow}</span>
      </div>
      <Chip tone="brass">{generated.surface.toUpperCase()}</Chip>
    </header>

    <h3 className="mt-3 font-display text-[1.05rem] leading-tight tracking-tight text-[var(--text-strong)]">
      {generated.title}
    </h3>

    {/* — URL row — */}
    <div className="mt-3">
      <div className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
        URL
      </div>
      <div className="mt-1 flex items-stretch gap-2">
        <div className="flex-1 overflow-x-auto rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-panel-strong)] px-3 py-2 font-mono text-[0.75rem] text-[var(--text-strong)]">
          <span className="whitespace-nowrap">{generated.href}</span>
        </div>
        <CopyButton text={generated.href} onCopy={() => onLinkCopied(generated.surface, 'url')}>
          COPY URL
        </CopyButton>
      </div>
    </div>

    {/* — Pitch row — */}
    <div className="mt-4">
      <div className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
        OUTREACH CAPTION
      </div>
      <div className="mt-1 flex items-start gap-2">
        <blockquote className="flex-1 whitespace-pre-line rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-panel-strong)] px-3 py-2 font-display italic text-[0.92rem] leading-snug text-[var(--text-strong)]">
          {generated.pitch}
        </blockquote>
        <CopyButton text={generated.pitch} onCopy={() => onLinkCopied(generated.surface, 'pitch')}>
          COPY PITCH
        </CopyButton>
      </div>
    </div>

    {/* — Open preview — */}
    <div className="mt-4 flex items-center justify-between border-t border-dashed border-[var(--border-subtle)] pt-3">
      <span className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
        PREVIEW OPENS A NEW TAB · LIVE OVERRIDES APPLIED
      </span>
      <Link
        href={generated.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => onPreviewOpened(generated.surface, variantId)}
        className={[
          'group/open inline-flex h-7 items-center gap-1.5 rounded-sm border border-[var(--border-brass)]',
          'bg-[color-mix(in_oklab,var(--accent-brass)_10%,transparent)] px-3',
          'font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--accent-brass)]',
          'transition-colors hover:bg-[color-mix(in_oklab,var(--accent-brass)_18%,transparent)]',
        ].join(' ')}
      >
        OPEN PREVIEW
        <Arrow />
      </Link>
    </div>
  </article>
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
