'use client';

import type { ChangeEvent, FC } from 'react';
import { Chip } from '@/components/Chip';
import { PanelFrame } from '@/components/SeedIntakePanel';
import { RESULT_VARIANTS, type ResultVariant, type ThreatLevel } from '@/lib/result-variants';

interface SeedVariantPanelProps {
  activeVariantId: string;
  onVariantChange: (id: string) => void;
  powerScore: number;
  onPowerScoreChange: (score: number) => void;
  threatLevel: ThreatLevel;
  onThreatLevelChange: (threat: ThreatLevel) => void;
  captionIndex: number;
  onCaptionIndexChange: (index: number) => void;
}

const THREAT_LEVELS: readonly ThreatLevel[] = ['Green', 'Amber', 'Red', 'Cerulean'];

/**
 * §II — Variant tuning.
 *
 * Operator-side controls for the acoustic profile overrides. Composed of
 * three subsections:
 *
 *   - Variant picker: a vertical list of all registered ResultVariants
 *     with switcher code, classification, and base score visible. The
 *     active row glows brass.
 *   - Score slider: 0..100 horizontal slider with the numeric value
 *     displayed in tabular-nums display type, plus a brass bar mirror of
 *     the slider value for visual feedback.
 *   - Threat chips: four threat-level chips, the active one highlighted.
 *   - Caption select: the five variant captions as radio rows so the
 *     operator can change the "featured" caption (which gets rotated to
 *     index 0 by `applySeedOverridesToVariant`).
 */
export const SeedVariantPanel: FC<SeedVariantPanelProps> = ({
  activeVariantId,
  onVariantChange,
  powerScore,
  onPowerScoreChange,
  threatLevel,
  onThreatLevelChange,
  captionIndex,
  onCaptionIndexChange,
}) => {
  const onScore = (e: ChangeEvent<HTMLInputElement>) => {
    const n = Number.parseInt(e.target.value, 10);
    if (Number.isFinite(n)) onPowerScoreChange(Math.min(100, Math.max(0, n)));
  };

  const activeVariant = RESULT_VARIANTS.find((v) => v.id === activeVariantId) ?? RESULT_VARIANTS[0];

  return (
    <PanelFrame index="§II" code="ACOUSTIC PROFILE" title="Variant tuning">
      <Field label="CLASSIFICATION" hint="Pick the base flavour. All overrides below are applied on top.">
        <ul className="grid grid-cols-1 gap-2">
          {RESULT_VARIANTS.map((v) => (
            <VariantRow
              key={v.id}
              variant={v}
              selected={v.id === activeVariantId}
              onSelect={() => onVariantChange(v.id)}
            />
          ))}
        </ul>
      </Field>

      <Field
        label="POWER SCORE OVERRIDE"
        hint={`Base: ${activeVariant.powerScore} / 100. Drag the slider to tune.`}
      >
        <div className="rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-panel-strong)] p-4">
          <div className="flex items-baseline justify-between">
            <span
              className="font-display text-[var(--text-strong)]"
              style={{
                fontVariantNumeric: 'tabular-nums',
                fontSize: 'clamp(2rem, 5vw, 2.6rem)',
                lineHeight: 1,
                fontWeight: 500,
              }}
            >
              {powerScore.toString().padStart(2, '0')}
            </span>
            <span className="font-mono text-[0.65rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
              / 100
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={powerScore}
            onChange={onScore}
            aria-label="Power score override"
            className={[
              'mt-3 w-full appearance-none bg-transparent',
              '[&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-full',
              '[&::-webkit-slider-runnable-track]:bg-[var(--border-subtle)]',
              '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:-mt-1.5',
              '[&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4',
              '[&::-webkit-slider-thumb]:rounded-full',
              '[&::-webkit-slider-thumb]:bg-[var(--accent-brass)]',
              '[&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-[var(--bg-base)]',
              '[&::-moz-range-track]:h-1 [&::-moz-range-track]:rounded-full',
              '[&::-moz-range-track]:bg-[var(--border-subtle)]',
              '[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4',
              '[&::-moz-range-thumb]:rounded-full',
              '[&::-moz-range-thumb]:bg-[var(--accent-brass)]',
              '[&::-moz-range-thumb]:border-0',
            ].join(' ')}
          />
          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-[var(--bg-panel)]">
            <div
              className="h-full rounded-full bg-[var(--accent-brass)] transition-[width] duration-150"
              style={{ width: `${powerScore}%` }}
            />
          </div>
        </div>
      </Field>

      <Field label="THREAT LEVEL OVERRIDE" hint={`Base: ${activeVariant.threatLevel}.`}>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {THREAT_LEVELS.map((t) => {
            const selected = t === threatLevel;
            return (
              <li key={t}>
                <button
                  type="button"
                  onClick={() => onThreatLevelChange(t)}
                  aria-pressed={selected}
                  className={[
                    'flex w-full flex-col items-start gap-1 rounded-sm border px-3 py-2 text-left transition-colors',
                    selected
                      ? 'border-[var(--accent-brass)] bg-[color-mix(in_oklab,var(--accent-brass)_10%,transparent)]'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-panel)] hover:border-[var(--border-stark)]',
                  ].join(' ')}
                >
                  <span className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
                    THREAT · {t.toUpperCase()}
                  </span>
                  <span className="text-[0.85rem] text-[var(--text-strong)]">{t}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </Field>

      <Field label="FEATURED CAPTION" hint="The caption shown on the share card and as the dossier's primary line.">
        <ul className="flex flex-col gap-2">
          {activeVariant.captions.map((c, i) => {
            const selected = i === captionIndex;
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => onCaptionIndexChange(i)}
                  aria-pressed={selected}
                  className={[
                    'flex w-full items-start gap-3 rounded-sm border px-3 py-2 text-left transition-colors',
                    selected
                      ? 'border-[var(--accent-brass)] bg-[color-mix(in_oklab,var(--accent-brass)_8%,transparent)]'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-panel)] hover:border-[var(--border-stark)]',
                  ].join(' ')}
                >
                  <Chip tone={selected ? 'brass' : 'neutral'}>
                    {`№ ${String(i + 1).padStart(2, '0')}`}
                  </Chip>
                  <span className="text-[0.9rem] leading-snug text-[var(--text-default)]">{c}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </Field>
    </PanelFrame>
  );
};

const VariantRow: FC<{
  variant: ResultVariant;
  selected: boolean;
  onSelect: () => void;
}> = ({ variant, selected, onSelect }) => (
  <li>
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={[
        'group/var flex w-full items-start justify-between gap-3 rounded-sm border px-3 py-2.5 text-left transition-colors',
        selected
          ? 'border-[var(--accent-brass)] bg-[color-mix(in_oklab,var(--accent-brass)_8%,transparent)]'
          : 'border-[var(--border-subtle)] bg-[var(--bg-panel)] hover:border-[var(--border-stark)]',
      ].join(' ')}
    >
      <div className="min-w-0">
        <div className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
          {variant.switcherCode}
        </div>
        <div className="mt-0.5 truncate font-display text-[1rem] leading-tight text-[var(--text-strong)]">
          {variant.classification}
        </div>
        <div className="truncate text-[0.75rem] text-[var(--text-muted)]">{variant.subjectTitle}</div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <Chip tone="brass">{variant.powerScore} / 100</Chip>
        <span className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
          {variant.threatLevel.toUpperCase()}
        </span>
      </div>
    </button>
  </li>
);

const Field: FC<{ label: string; hint?: string; children: React.ReactNode }> = ({
  label,
  hint,
  children,
}) => (
  <div>
    <div className="flex items-center gap-2 font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
      <span aria-hidden="true" className="brand-rule h-px w-5 opacity-90" />
      <span>{label}</span>
    </div>
    <div className="mt-2">{children}</div>
    {hint ? (
      <div className="mt-1.5 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
        {hint}
      </div>
    ) : null}
  </div>
);
