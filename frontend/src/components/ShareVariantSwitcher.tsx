'use client';

import type { FC } from 'react';
import { RESULT_VARIANTS } from '@/lib/result-variants';

interface ShareVariantSwitcherProps {
  activeId: string;
  onChange: (id: string) => void;
}

/**
 * Minimal preview switcher for the /share route.
 *
 * Lighter and quieter than the `/report` mockup switcher because the share
 * page already has a strong visual presence — a heavy switcher would fight
 * the artifact. Renders as a single dashed strip of brass tags with the
 * classification names visible (the /report version uses codes).
 */
export const ShareVariantSwitcher: FC<ShareVariantSwitcherProps> = ({ activeId, onChange }) => (
  <section className="mx-auto w-full max-w-7xl px-6 pt-4 lg:px-10">
    <div
      className={[
        'rounded-md border border-dashed border-[var(--border-stark)]',
        'bg-[color-mix(in_oklab,var(--bg-panel-strong)_85%,transparent)] px-4 py-3',
      ].join(' ')}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="brand-rule h-px w-6 opacity-90" />
          <span className="font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
            PREVIEW · MOCK DOSSIERS
          </span>
          <span aria-hidden="true" className="hidden h-3 w-px bg-[var(--border-stark)] md:inline-block" />
          <span className="hidden font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)] md:inline">
            INTERNAL · for screenshot evaluation
          </span>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Share-card variant preview"
        className={[
          'mt-3 flex gap-2 overflow-x-auto pb-1',
          '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden',
        ].join(' ')}
      >
        {RESULT_VARIANTS.map((v) => {
          const active = v.id === activeId;
          return (
            <button
              key={v.id}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => onChange(v.id)}
              className={[
                'shrink-0 rounded-sm border px-3 py-1.5',
                'font-mono text-[0.6rem] uppercase tracking-wide-3 transition-colors duration-200',
                active
                  ? 'border-[var(--accent-brass)] bg-[color-mix(in_oklab,var(--accent-brass)_12%,transparent)] text-[var(--accent-brass)]'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-panel)] text-[var(--text-muted)] hover:border-[var(--border-stark)] hover:text-[var(--text-default)]',
              ].join(' ')}
            >
              {v.classification.toUpperCase()}
            </button>
          );
        })}
      </div>
    </div>
  </section>
);
