'use client';

import { motion } from 'framer-motion';
import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type FC,
  type FormEvent,
} from 'react';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { FoundingBadge } from '@/components/FoundingBadge';
import {
  persistWaitlistSubmission,
  readWaitlistSubmission,
  type WaitlistSubmission,
} from '@/lib/waitlist';

interface EarlyAccessPanelProps {
  /** Anchor id so the in-page CTA can scroll-to / focus this panel. */
  anchorId: string;
  /** Fires the moment the user clicks submit (intent). */
  onRequest: (input: { hasName: boolean; hasEmail: boolean; hasFartName: boolean }) => void;
  /** Fires after local persistence succeeds. */
  onSubmitted: (record: WaitlistSubmission) => void;
  /** Fires for analytics when the badge is hovered/clicked. */
  onBadgeInteracted: (kind: 'hover' | 'click', hasFounderNumber: boolean) => void;
}

const EASE = [0.22, 0.61, 0.36, 1] as const;

type FormState = 'idle' | 'pending' | 'submitted';

/**
 * Early-access form panel.
 *
 * Two columns at >=lg, stacked below:
 *   - Left:  form (designation, channel of contact, brand-voice question)
 *   - Right: <FoundingBadge> showing un-issued state pre-submit, then
 *            issued state once the form is filed.
 *
 * The submission is local-only (localStorage), so refreshes preserve the
 * success state. When the real intake endpoint lands, replace
 * `persistWaitlistSubmission` with the POST and keep the same UI states.
 *
 * Form states:
 *   idle      → form is visible, submit enabled
 *   pending   → submit clicked; we briefly hold for visual weight
 *               (~600ms) so it doesn't feel like nothing happened.
 *   submitted → form replaced by a "Filed." success block; badge swaps
 *               into its issued state.
 */
export const EarlyAccessPanel: FC<EarlyAccessPanelProps> = ({
  anchorId,
  onRequest,
  onSubmitted,
  onBadgeInteracted,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [fartName, setFartName] = useState('');
  const [state, setState] = useState<FormState>('idle');
  const [record, setRecord] = useState<WaitlistSubmission | null>(null);

  // Hydrate from localStorage on mount — if the user has already filed,
  // we render the success state without re-firing analytics.
  useEffect(() => {
    const prior = readWaitlistSubmission();
    if (prior) {
      setRecord(prior);
      setState('submitted');
      setName(prior.name);
      setEmail(prior.email);
      setFartName(prior.fartName);
    }
  }, []);

  const onChange =
    (setter: (v: string) => void) =>
    (e: ChangeEvent<HTMLInputElement>): void =>
      setter(e.target.value);

  const onSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (state === 'pending' || state === 'submitted') return;

      const payload = { name, email, fartName };
      const hasName = payload.name.trim().length > 0;
      const hasEmail = payload.email.trim().length > 0;
      const hasFartName = payload.fartName.trim().length > 0;
      onRequest({ hasName, hasEmail, hasFartName });

      setState('pending');
      // 600ms of pending so the form has weight before it transforms. The
      // localStorage write itself is synchronous; the delay is purely UX.
      window.setTimeout(() => {
        const next = persistWaitlistSubmission(payload);
        setRecord(next);
        setState('submitted');
        onSubmitted(next);
      }, 600);
    },
    [name, email, fartName, state, onRequest, onSubmitted],
  );

  const onBadgeInteract = useCallback(
    (kind: 'hover' | 'click') => onBadgeInteracted(kind, record !== null),
    [onBadgeInteracted, record],
  );

  return (
    <motion.section
      id={anchorId}
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
        <span>REQUEST FOR FOUNDING ACCESS</span>
        <span aria-hidden="true" className="brand-rule h-px flex-1 opacity-40" />
      </header>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1.3fr_1fr] lg:gap-12">
        <div
          className={[
            'relative overflow-hidden rounded-md border border-[var(--border-stark)]',
            'bg-[color-mix(in_oklab,var(--bg-panel)_85%,transparent)] p-7',
            'shadow-[0_30px_60px_-30px_color-mix(in_oklab,black_70%,transparent)]',
          ].join(' ')}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="font-display text-2xl leading-tight tracking-tight text-[var(--text-strong)] sm:text-3xl">
              File a founding designation.
            </div>
            {state === 'submitted' ? (
              <Chip tone="green" withDot>
                FILED · IN LEDGER
              </Chip>
            ) : (
              <Chip tone="amber" withDot>
                ROSTER · OPEN
              </Chip>
            )}
          </div>

          <p className="mt-3 max-w-[48ch] text-[0.95rem] leading-relaxed text-[var(--text-default)]">
            Founding designations are processed in filing order. No payment is taken today. Your
            details remain on this device and are not transmitted; you may unfile at any time by
            clearing site data.
          </p>

          {state === 'submitted' && record ? (
            <SubmittedSummary record={record} />
          ) : (
            <form className="mt-6 flex flex-col gap-5" onSubmit={onSubmit}>
              <Field
                id="ea-name"
                label="Designation"
                hint="Optional. Used on the founding badge."
                placeholder="e.g. The Honourable A. Velvetine"
                value={name}
                onChange={onChange(setName)}
                autoComplete="name"
                disabled={state === 'pending'}
              />
              <Field
                id="ea-email"
                label="Channel of contact"
                hint="Optional. Stored on your device only. The Bureau will not write you uninvited."
                placeholder="e.g. a.velvetine@bag.gov"
                value={email}
                onChange={onChange(setEmail)}
                autoComplete="email"
                inputMode="email"
                disabled={state === 'pending'}
              />
              <Field
                id="ea-fart-name"
                label="What should humanity name your first documented fart?"
                hint="Optional but encouraged. The Bureau will not judge. Out loud."
                placeholder="e.g. The Whispering Diplomat"
                value={fartName}
                onChange={onChange(setFartName)}
                autoComplete="off"
                disabled={state === 'pending'}
              />

              <div className="mt-2 flex flex-wrap items-center gap-3">
                <Button
                  variant="primary"
                  type="submit"
                  disabled={state === 'pending'}
                  trailing={state === 'pending' ? <Spinner /> : <Arrow />}
                >
                  {state === 'pending' ? 'Filing…' : 'File request'}
                </Button>
                <span className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
                  No payment processed · No PII transmitted · Local persistence only
                </span>
              </div>
            </form>
          )}
        </div>

        <FoundingBadge
          founderNumber={record?.founderNumber ?? null}
          designation={record?.name?.length ? record.name : undefined}
          submittedAtIso={record?.submittedAtIso}
          onInteract={onBadgeInteract}
        />
      </div>
    </motion.section>
  );
};

const SubmittedSummary: FC<{ record: WaitlistSubmission }> = ({ record }) => (
  <div className="mt-6 flex flex-col gap-4 rounded-md border border-dashed border-[var(--border-brass)] bg-[color-mix(in_oklab,var(--accent-brass)_6%,transparent)] p-5">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="font-display text-xl leading-tight tracking-tight text-[var(--text-strong)]">
        Filed. Founding designation reserved.
      </div>
      <Chip tone="brass">FOUNDER № {record.founderNumber}</Chip>
    </div>
    <ul className="grid grid-cols-1 gap-2 text-[0.9rem] text-[var(--text-default)] sm:grid-cols-2">
      <SummaryRow label="DESIGNATION" value={record.name || 'Anonymous founder'} />
      <SummaryRow label="CHANNEL" value={record.email || 'Withheld on file'} />
      <SummaryRow
        label="FIRST DOCUMENTED FART"
        value={record.fartName || 'Pending naming'}
        span
      />
    </ul>
    <div className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
      Your founding ledger entry is stored locally. The Bureau will reconcile it against the public
      filing ledger on release day.
    </div>
  </div>
);

const SummaryRow: FC<{ label: string; value: string; span?: boolean }> = ({ label, value, span }) => (
  <li
    className={[
      'rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-panel)] px-3 py-2',
      span ? 'sm:col-span-2' : '',
    ].join(' ')}
  >
    <div className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
      {label}
    </div>
    <div className="mt-0.5 text-[var(--text-default)]">{value}</div>
  </li>
);

interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  placeholder?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  autoComplete?: string;
  inputMode?: 'email' | 'text' | 'search';
  disabled?: boolean;
}

const Field: FC<FieldProps> = ({
  id,
  label,
  hint,
  placeholder,
  value,
  onChange,
  autoComplete,
  inputMode,
  disabled,
}) => (
  <div>
    <label
      htmlFor={id}
      className="flex items-center gap-2 font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--accent-brass)]"
    >
      <span aria-hidden="true" className="brand-rule h-px w-5 opacity-90" />
      <span>{label}</span>
    </label>
    <input
      id={id}
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      autoComplete={autoComplete}
      inputMode={inputMode}
      disabled={disabled}
      className={[
        'mt-2 w-full rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-panel-strong)] px-3 py-2.5',
        'font-sans text-[0.95rem] text-[var(--text-strong)] placeholder:text-[var(--text-faint)]',
        'outline-none transition-colors',
        'hover:border-[var(--border-stark)]',
        'focus:border-[var(--accent-brass)] focus:ring-1 focus:ring-[var(--accent-brass)]',
        'disabled:opacity-60',
      ].join(' ')}
    />
    {hint ? (
      <div className="mt-1.5 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
        {hint}
      </div>
    ) : null}
  </div>
);

const Arrow: FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
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

const Spinner: FC = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    aria-hidden="true"
    className="animate-spin"
  >
    <path
      d="M12 3a9 9 0 1 0 9 9"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);
