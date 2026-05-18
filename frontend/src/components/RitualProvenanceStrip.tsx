'use client';

import type { FC } from 'react';
import type { RitualProvenance } from '@/lib/rituals-api';

export interface RitualProvenanceStripProps {
  surface: 'methane' | 'wrapped';
  provenance: RitualProvenance;
  /** When API failed before returning an envelope. */
  fetchFailed?: boolean;
  windowLabel?: string;
}

/**
 * Thin bureau strip explaining whether ritual data is query-backed.
 */
export const RitualProvenanceStrip: FC<RitualProvenanceStripProps> = ({
  surface,
  provenance,
  fetchFailed,
  windowLabel,
}) => {
  if (fetchFailed) {
    return (
      <div className="mx-auto w-full max-w-7xl px-6 font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-muted)] lg:px-10">
        <div className="flex flex-wrap items-center gap-2 rounded-sm border border-dashed border-[var(--border-brass)] bg-[color-mix(in_oklab,var(--accent-brass)_6%,transparent)] px-3 py-2 text-[var(--accent-brass)]">
          <span className="rounded-sm border border-[var(--border-brass)] px-1.5 py-px text-[0.55rem]">LEDGER</span>
          <span>Upstream unavailable · canonical bulletin displayed</span>
        </div>
      </div>
    );
  }

  if (provenance === 'live') {
    return (
      <div className="mx-auto w-full max-w-7xl px-6 font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-muted)] lg:px-10">
        <div className="flex flex-wrap items-center gap-2 rounded-sm border border-[var(--border-stark)] bg-[var(--bg-panel)] px-3 py-2 text-[var(--text-default)]">
          <span className="rounded-sm border border-[var(--accent-teal)] px-1.5 py-px text-[0.55rem] text-[var(--accent-teal)]">
            LIVE
          </span>
          <span>
            {surface === 'methane' ? 'Methane Index' : 'Fart Wrapped'} · query-backed issuance
            {windowLabel ? ` · ${windowLabel}` : ''}
          </span>
        </div>
      </div>
    );
  }

  if (provenance === 'low_volume') {
    return (
      <div className="mx-auto w-full max-w-7xl px-6 font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-muted)] lg:px-10">
        <div className="flex flex-wrap items-center gap-2 rounded-sm border border-dashed border-[var(--border-brass)] bg-[color-mix(in_oklab,var(--accent-brass)_6%,transparent)] px-3 py-2 text-[var(--accent-brass)]">
          <span className="rounded-sm border border-[var(--border-brass)] px-1.5 py-px text-[0.55rem]">PROVISIONAL</span>
          <span>Low filing volume · interpret movement cautiously</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-6 font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-muted)] lg:px-10">
      <div className="flex flex-wrap items-center gap-2 rounded-sm border border-dashed border-[var(--border-subtle)] bg-[var(--bg-panel)] px-3 py-2 text-[var(--text-faint)]">
        <span className="rounded-sm border border-[var(--border-subtle)] px-1.5 py-px text-[0.55rem]">CANONICAL</span>
        <span>No completed dossiers in window · ceremonial fallback bulletin</span>
      </div>
    </div>
  );
};
