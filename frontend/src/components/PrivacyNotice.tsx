import type { FC } from 'react';

interface PrivacyNoticeProps {
  /** Tight one-line variant for the capture chamber, long-form for intake. */
  variant?: 'compact' | 'detailed';
}

/**
 * Bureau-tone privacy strip.
 *
 * Compact = single line, sits under the capture dial.
 * Detailed = three short bullets for the intake screen.
 *
 * The copy is intentionally factual ("microphone active only during
 * capture") rather than reassuring — the strategy doc is explicit that
 * trustworthiness should be earned with concrete language, not vibes.
 */
export const PrivacyNotice: FC<PrivacyNoticeProps> = ({ variant = 'compact' }) => {
  if (variant === 'compact') {
    return (
      <div
        className={[
          'flex items-center justify-center gap-2',
          'font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-muted)]',
        ].join(' ')}
      >
        <Shield />
        <span>Microphone active only during capture. No public posting by default.</span>
      </div>
    );
  }

  return (
    <div
      className={[
        'rounded-md border border-[var(--border-subtle)]',
        'bg-[color-mix(in_oklab,var(--bg-panel)_75%,transparent)] px-5 py-4 backdrop-blur-md',
      ].join(' ')}
    >
      <div className="flex items-center gap-3">
        <span className="brand-rule h-px w-6 opacity-90" />
        <span className="font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
          BUREAU PRIVACY POLICY · §1.4
        </span>
      </div>
      <ul className="mt-3 grid grid-cols-1 gap-2 text-sm leading-relaxed text-[var(--text-default)] sm:grid-cols-3">
        <li className="flex gap-2">
          <Bullet />
          <span>Microphone active <em className="text-[var(--text-strong)] not-italic">only during capture</em>.</span>
        </li>
        <li className="flex gap-2">
          <Bullet />
          <span>Sample is processed for analysis only. <em className="text-[var(--text-strong)] not-italic">No retention</em> beyond this session.</span>
        </li>
        <li className="flex gap-2">
          <Bullet />
          <span>Reports are private by default. <em className="text-[var(--text-strong)] not-italic">Public posting requires explicit action</em>.</span>
        </li>
      </ul>
    </div>
  );
};

const Shield: FC = () => (
  <svg width="10" height="11" viewBox="0 0 10 11" aria-hidden="true" className="text-[var(--accent-brass)]">
    <path
      d="M5 0.6 L0.8 2.2 V5.4 C0.8 7.7 2.6 9.6 5 10.4 C7.4 9.6 9.2 7.7 9.2 5.4 V2.2 Z"
      stroke="currentColor"
      strokeWidth="0.8"
      fill="none"
    />
  </svg>
);

const Bullet: FC = () => (
  <span aria-hidden="true" className="mt-1 inline-block h-1 w-3 shrink-0 bg-[var(--accent-brass)] opacity-80" />
);
