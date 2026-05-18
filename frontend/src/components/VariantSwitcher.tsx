'use client';

import type { FC } from 'react';
import { RESULT_VARIANTS } from '@/lib/result-variants';

interface VariantSwitcherProps {
  activeId: string;
  onChange: (id: string) => void;
}

/**
 * Internal mockup-testing panel.
 *
 * Reads explicitly as "DEVELOPMENT INSTRUMENT" so it doesn't masquerade as
 * a production UI control — the design language is intentionally narrower
 * and more clinical than the rest of the page. Horizontal-scrolling on
 * mobile so all eight variants stay reachable in a single row.
 */
export const VariantSwitcher: FC<VariantSwitcherProps> = ({ activeId, onChange }) => (
  <section className="mx-auto w-full max-w-7xl px-6 pt-6 lg:px-10">
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
            FILE SELECTOR · MOCK DOSSIERS
          </span>
          <span className="hidden h-3 w-px bg-[var(--border-stark)] md:inline-block" />
          <span className="hidden font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)] md:inline">
            INTERNAL · for screenshot evaluation
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
          <span>VARIANT</span>
          <span className="text-[var(--accent-brass)]">{indexOf(activeId)} / {RESULT_VARIANTS.length}</span>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Mock report variants"
        className={[
          'mt-3 flex gap-2 overflow-x-auto pb-1',
          // hide ugly scrollbars but keep horizontal scroll for tab overflow
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
                'group/tab relative shrink-0 rounded-sm border px-3 py-1.5',
                'font-mono text-[0.6rem] uppercase tracking-wide-3 transition-colors duration-200',
                active
                  ? 'border-[var(--accent-brass)] bg-[color-mix(in_oklab,var(--accent-brass)_12%,transparent)] text-[var(--accent-brass)]'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-panel)] text-[var(--text-muted)] hover:border-[var(--border-stark)] hover:text-[var(--text-default)]',
              ].join(' ')}
            >
              <span>{v.switcherCode}</span>
              {active ? (
                <span
                  aria-hidden="true"
                  className="absolute -bottom-px left-0 right-0 mx-auto h-px w-6 bg-[var(--accent-brass)]"
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  </section>
);

function indexOf(id: string): string {
  const i = RESULT_VARIANTS.findIndex((v) => v.id === id);
  if (i < 0) return '?';
  return String(i + 1).padStart(2, '0');
}
