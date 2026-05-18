'use client';

import type { FC } from 'react';
import { Chip } from '@/components/Chip';
import { PanelFrame } from '@/components/SeedIntakePanel';
import type { SeedSurface } from '@/lib/seed';

export type SurfaceToggles = Record<SeedSurface, boolean>;

interface SeedOutputPanelProps {
  toggles: SurfaceToggles;
  onToggle: (surface: SeedSurface, enabled: boolean) => void;
}

const SURFACES: readonly {
  id: SeedSurface;
  index: string;
  title: string;
  caption: string;
  basePath: string;
}[] = [
  {
    id: 'report',
    index: 'D',
    title: 'Dossier',
    caption: 'Full /report surface with classification, score, captions, modules.',
    basePath: '/report',
  },
  {
    id: 'share',
    index: 'S',
    title: 'Share card',
    caption: 'Vertical 9:16 poster optimised for screenshots and DM forwards.',
    basePath: '/share',
  },
  {
    id: 'challenge',
    index: 'C',
    title: 'Challenge notice',
    caption: 'Send-to-friend ceremonial dispute surface with rival-score framing.',
    basePath: '/challenge',
  },
  {
    id: 'premium',
    index: 'P',
    title: 'Premium certificate',
    caption: 'Bureau certification services. PDF / wall-format previews.',
    basePath: '/premium',
  },
];

/**
 * §III — Output surface selector.
 *
 * Four checkbox-style toggles, one per surface the seed tool can prep.
 * Each toggle row carries the surface code, a short caption, and the
 * base path it will produce a link for. When the toggle is on, the
 * matching card in `SeedLinkPanel` renders below.
 *
 * Toggles map 1:1 to the SeedSurface enum. State is owned by the
 * orchestrator so the analytics + the link panel see updates in lockstep.
 */
export const SeedOutputPanel: FC<SeedOutputPanelProps> = ({ toggles, onToggle }) => (
  <PanelFrame index="§III" code="OUTBOUND ARTIFACT TYPE" title="Output surfaces">
    <p className="text-[0.85rem] leading-snug text-[var(--text-default)]">
      Pick the artifact types to prepare. Each enabled surface produces a copy-ready URL plus a
      platform-aware pitch caption in §V.
    </p>

    <ul className="grid grid-cols-1 gap-3">
      {SURFACES.map((s) => {
        const enabled = toggles[s.id];
        return (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onToggle(s.id, !enabled)}
              aria-pressed={enabled}
              className={[
                'group/out flex w-full items-start justify-between gap-4 rounded-sm border px-4 py-3 text-left transition-colors',
                enabled
                  ? 'border-[var(--accent-brass)] bg-[color-mix(in_oklab,var(--accent-brass)_8%,transparent)]'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-panel)] hover:border-[var(--border-stark)]',
              ].join(' ')}
            >
              <div className="flex min-w-0 items-start gap-3">
                <ToggleSquare on={enabled} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
                    <span className="rounded-sm border border-[var(--border-brass)] px-1.5 py-px text-[0.5rem]">
                      {s.index}
                    </span>
                    <span>{s.basePath}</span>
                  </div>
                  <div className="mt-1 font-display text-[1rem] leading-tight tracking-tight text-[var(--text-strong)]">
                    {s.title}
                  </div>
                  <div className="mt-0.5 text-[0.8rem] leading-snug text-[var(--text-muted)]">{s.caption}</div>
                </div>
              </div>
              <Chip tone={enabled ? 'green' : 'neutral'}>{enabled ? 'PREPARED' : 'SKIPPED'}</Chip>
            </button>
          </li>
        );
      })}
    </ul>
  </PanelFrame>
);

const ToggleSquare: FC<{ on: boolean }> = ({ on }) => (
  <span
    aria-hidden="true"
    className={[
      'mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded-sm border transition-colors',
      on
        ? 'border-[var(--accent-brass)] bg-[var(--accent-brass)] text-[var(--bg-base)]'
        : 'border-[var(--border-stark)] bg-[var(--bg-panel-strong)] text-transparent',
    ].join(' ')}
  >
    <svg width="11" height="11" viewBox="0 0 12 12">
      <path
        d="M1.6 6.4 L4.6 9.2 L10.2 2.8"
        stroke="currentColor"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="square"
      />
    </svg>
  </span>
);
