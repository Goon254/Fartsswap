import type { FC, ReactNode } from 'react';

interface SectionLabelProps {
  /** All-caps eyebrow text. */
  children: ReactNode;
  /** Optional small "II" / "II / III" style index. */
  index?: string;
  align?: 'start' | 'center';
}

/**
 * Eyebrow used above section headlines, with an editorial brass rule.
 *
 *   ── I ──  CLASSIFIED ACOUSTIC DIAGNOSTICS
 *
 * The brass rule + index numeral land as document-section markings rather
 * than typical landing-page small caps.
 */
export const SectionLabel: FC<SectionLabelProps> = ({ children, index, align = 'start' }) => {
  const alignment = align === 'center' ? 'justify-center text-center' : 'justify-start';
  return (
    <div
      className={`flex items-center gap-3 font-mono text-[0.7rem] uppercase tracking-wide-3 text-[var(--accent-brass)] ${alignment}`}
    >
      <span aria-hidden="true" className="brand-rule h-px w-8 opacity-80" />
      {index ? (
        <span className="rounded-sm border border-[var(--border-brass)] px-1.5 py-px text-[0.6rem] text-[var(--accent-brass)]">
          {index}
        </span>
      ) : null}
      <span className="text-[var(--accent-brass)]">{children}</span>
      <span aria-hidden="true" className="brand-rule h-px flex-1 opacity-40" />
    </div>
  );
};
