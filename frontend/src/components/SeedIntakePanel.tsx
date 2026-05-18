'use client';

import type { ChangeEvent, FC } from 'react';
import { Chip } from '@/components/Chip';
import {
  PLATFORM_PRESETS,
  TARGET_TYPES,
  type PlatformPreset,
  type TargetType,
} from '@/lib/seed';

interface SeedIntakePanelProps {
  targetLabel: string;
  onTargetLabelChange: (value: string) => void;
  targetType: TargetType;
  onTargetTypeChange: (type: TargetType) => void;
  platform: PlatformPreset;
  onPlatformChange: (platform: PlatformPreset) => void;
  notes: string;
  onNotesChange: (value: string) => void;
}

/**
 * §I — Seed intake.
 *
 * Operator console block for "who is this artifact for". Reads as a
 * bureau dispatch card: target designation field, four target-type
 * radios, a wide platform-preset chip row, and an optional operator
 * notes textarea (not persisted; for the operator's eyes only).
 *
 * All state lives in the parent so the orchestrator owns the analytics
 * surface and the URL generation downstream.
 */
export const SeedIntakePanel: FC<SeedIntakePanelProps> = ({
  targetLabel,
  onTargetLabelChange,
  targetType,
  onTargetTypeChange,
  platform,
  onPlatformChange,
  notes,
  onNotesChange,
}) => {
  const onLabel = (e: ChangeEvent<HTMLInputElement>) => onTargetLabelChange(e.target.value);
  const onNote = (e: ChangeEvent<HTMLTextAreaElement>) => onNotesChange(e.target.value);

  return (
    <PanelFrame index="§I" code="DISPATCH" title="Seed intake">
      <FormField id="seed-target" label="TARGET DESIGNATION" hint="Subject name printed on the dossier.">
        <input
          id="seed-target"
          type="text"
          value={targetLabel}
          onChange={onLabel}
          placeholder="e.g. Bob the Builder · Acme Co · @memeaccount"
          className={[
            'w-full rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-panel-strong)] px-3 py-2.5',
            'font-sans text-[0.95rem] text-[var(--text-strong)] placeholder:text-[var(--text-faint)]',
            'outline-none transition-colors',
            'hover:border-[var(--border-stark)]',
            'focus:border-[var(--accent-brass)] focus:ring-1 focus:ring-[var(--accent-brass)]',
          ].join(' ')}
        />
      </FormField>

      <FormField label="TARGET TYPE" hint="Drives the operator chip and analytics attribution.">
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {TARGET_TYPES.map((t) => {
            const selected = t.id === targetType;
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => onTargetTypeChange(t.id)}
                  aria-pressed={selected}
                  className={[
                    'group/tt flex w-full flex-col items-start gap-1 rounded-sm border px-3 py-2 text-left transition-colors',
                    selected
                      ? 'border-[var(--accent-brass)] bg-[color-mix(in_oklab,var(--accent-brass)_10%,transparent)]'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-panel)] hover:border-[var(--border-stark)]',
                  ].join(' ')}
                >
                  <span className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
                    {t.code}
                  </span>
                  <span className="text-[0.9rem] text-[var(--text-strong)]">{t.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </FormField>

      <FormField label="DISTRIBUTION SURFACE" hint="Tunes the outreach caption. Does not change the artifact itself.">
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {PLATFORM_PRESETS.map((p) => {
            const selected = p.id === platform;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onPlatformChange(p.id)}
                  aria-pressed={selected}
                  className={[
                    'group/p flex w-full flex-col items-start gap-1 rounded-sm border px-3 py-2 text-left transition-colors',
                    selected
                      ? 'border-[var(--accent-brass)] bg-[color-mix(in_oklab,var(--accent-brass)_10%,transparent)]'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-panel)] hover:border-[var(--border-stark)]',
                  ].join(' ')}
                >
                  <span className="flex items-center gap-2 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
                    <span className="rounded-sm border border-[var(--border-brass)] px-1 py-px text-[0.5rem]">
                      {p.code}
                    </span>
                    {p.label}
                  </span>
                  <span className="text-[0.7rem] text-[var(--text-muted)]">{p.hint}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </FormField>

      <FormField id="seed-notes" label="OPERATOR NOTES" hint="Local-only. Not transmitted, not threaded into URLs.">
        <textarea
          id="seed-notes"
          rows={3}
          value={notes}
          onChange={onNote}
          placeholder="Outreach context, embargoes, follow-up reminders…"
          className={[
            'w-full resize-y rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-panel-strong)] px-3 py-2.5',
            'font-mono text-[0.85rem] text-[var(--text-strong)] placeholder:text-[var(--text-faint)]',
            'outline-none transition-colors',
            'hover:border-[var(--border-stark)]',
            'focus:border-[var(--accent-brass)] focus:ring-1 focus:ring-[var(--accent-brass)]',
          ].join(' ')}
        />
      </FormField>

      <div className="flex flex-wrap items-center gap-2 border-t border-dashed border-[var(--border-subtle)] pt-4">
        <Chip tone="brass">SEEDED</Chip>
        <Chip tone="neutral">{TARGET_TYPES.find((t) => t.id === targetType)?.label}</Chip>
        {platform !== 'none' ? (
          <Chip tone="amber" withDot>
            PRESET · {PLATFORM_PRESETS.find((p) => p.id === platform)?.label}
          </Chip>
        ) : null}
      </div>
    </PanelFrame>
  );
};

// ---------------------------------------------------------------------------
// Shared panel frame
// ---------------------------------------------------------------------------

interface PanelFrameProps {
  index: string;
  code: string;
  title: string;
  children: React.ReactNode;
}

export const PanelFrame: FC<PanelFrameProps> = ({ index, code, title, children }) => (
  <section
    className={[
      'relative overflow-hidden rounded-md border border-[var(--border-stark)]',
      'bg-[color-mix(in_oklab,var(--bg-panel)_88%,transparent)] p-6',
      'shadow-[0_20px_50px_-30px_color-mix(in_oklab,black_60%,transparent)]',
    ].join(' ')}
  >
    <header className="mb-5 flex items-center justify-between gap-3 border-b border-dashed border-[var(--border-subtle)] pb-3">
      <div className="flex items-center gap-3 font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
        <span aria-hidden="true" className="brand-rule h-px w-6 opacity-90" />
        <span className="rounded-sm border border-[var(--border-brass)] px-1.5 py-px text-[0.6rem]">
          {index}
        </span>
        <span>{code}</span>
      </div>
      <h2 className="font-display text-xl leading-tight tracking-tight text-[var(--text-strong)]">
        {title}
      </h2>
    </header>
    <div className="flex flex-col gap-5">{children}</div>
  </section>
);

interface FormFieldProps {
  id?: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}

const FormField: FC<FormFieldProps> = ({ id, label, hint, children }) => (
  <div>
    <label
      htmlFor={id}
      className="flex items-center gap-2 font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--accent-brass)]"
    >
      <span aria-hidden="true" className="brand-rule h-px w-5 opacity-90" />
      <span>{label}</span>
    </label>
    <div className="mt-2">{children}</div>
    {hint ? (
      <div className="mt-1.5 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
        {hint}
      </div>
    ) : null}
  </div>
);
