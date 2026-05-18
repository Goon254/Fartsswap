'use client';

import { motion } from 'framer-motion';
import { useEffect, useState, type FC } from 'react';
import { Chip } from '@/components/Chip';
import { computeCountdown, pad2, RELEASE_TARGET_ISO } from '@/lib/launch-mode';

interface ReleaseBulletinProps {
  /** Override for testing / SSR-stable rendering. Defaults to RELEASE_TARGET_ISO. */
  targetIso?: string;
  /** Optional callback for analytics (CTA click on the bulletin's "request access"). */
  onRequestAccessClick?: () => void;
}

const EASE = [0.22, 0.61, 0.36, 1] as const;

/**
 * Release-day bulletin / deployment ladder.
 *
 * Composition:
 *   - Header strip: BULLETIN №7 OF 7 · DEPLOYMENT NOTICE
 *   - Countdown: D · H · M · S to the public filing target.
 *   - Deployment ladder: STAGING → CANARY → PRIMETIME with one step
 *     marked "ACTIVE".
 *   - Footer ribbon: target ISO + bureau footer.
 *
 * The countdown reads `Date.now()` only on the client to keep SSR
 * deterministic — the initial server paint shows "—" placeholders and
 * fills in after hydration. This is intentional so we don't ship a
 * different countdown to every viewer.
 */
export const ReleaseBulletin: FC<ReleaseBulletinProps> = ({
  targetIso = RELEASE_TARGET_ISO,
  onRequestAccessClick,
}) => {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setMounted(true);
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const parts = mounted ? computeCountdown(now, targetIso) : null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="mx-auto w-full max-w-7xl px-6 lg:px-10"
    >
      <article
        className={[
          'relative isolate overflow-hidden rounded-md border border-[var(--border-stark)]',
          'bg-[color-mix(in_oklab,var(--bg-panel)_85%,transparent)]',
          'shadow-[0_30px_60px_-30px_color-mix(in_oklab,black_70%,transparent)]',
        ].join(' ')}
      >
        {/* — Header strip — */}
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-[var(--border-stark)] bg-[var(--bg-panel-strong)] px-5 py-3">
          <div className="flex items-center gap-3 font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
            <span aria-hidden="true" className="brand-rule h-px w-6 opacity-90" />
            <span className="text-[var(--accent-brass)]">BULLETIN № 7 / 7 · DEPLOYMENT NOTICE</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Chip tone="brass">PUBLIC FILING · OPENS</Chip>
            {parts?.released ? (
              <Chip tone="green" withDot>
                FILING LINE OPEN
              </Chip>
            ) : (
              <Chip tone="amber" withDot>
                IN PRE-RELEASE
              </Chip>
            )}
          </div>
        </header>

        {/* — Countdown — */}
        <div className="grid grid-cols-1 items-end gap-6 px-6 py-6 sm:grid-cols-[1fr_auto] sm:px-8">
          <div>
            <div className="font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
              TIME UNTIL OPEN FILING
            </div>
            <div className="mt-3 grid grid-cols-4 gap-3 font-display text-[var(--text-strong)] sm:gap-5">
              <CountUnit label="DAYS" value={parts ? parts.days.toString().padStart(2, '0') : '— —'} />
              <CountUnit label="HOURS" value={parts ? pad2(parts.hours) : '— —'} />
              <CountUnit label="MIN" value={parts ? pad2(parts.minutes) : '— —'} />
              <CountUnit label="SEC" value={parts ? pad2(parts.seconds) : '— —'} />
            </div>
          </div>

          <div className="text-right">
            <div className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
              TARGET WINDOW
            </div>
            <div className="font-mono text-[0.95rem] text-[var(--text-default)]">
              {formatTarget(targetIso)}
            </div>
            <div className="mt-1 font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
              SUBJECT TO BUREAU REVIEW
            </div>
          </div>
        </div>

        {/* — Deployment ladder — */}
        <div className="grid grid-cols-1 gap-px border-t border-[var(--border-subtle)] bg-[var(--border-subtle)] sm:grid-cols-3">
          {DEPLOYMENT_STAGES.map((stage) => (
            <div
              key={stage.code}
              className={[
                'relative flex flex-col gap-1.5 bg-[var(--bg-panel)] px-5 py-4',
                stage.status === 'ACTIVE' ? 'ring-1 ring-inset ring-[var(--accent-brass)]' : '',
              ].join(' ')}
            >
              <div className="flex items-center justify-between">
                <div className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
                  {stage.code}
                </div>
                <Chip tone={stageTone(stage.status)} withDot={stage.status !== 'PENDING'}>
                  {stage.status}
                </Chip>
              </div>
              <div className="font-display text-[1.05rem] leading-tight tracking-tight text-[var(--text-strong)]">
                {stage.name}
              </div>
              <div className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
                {stage.detail}
              </div>
            </div>
          ))}
        </div>

        {/* — Footer — */}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-subtle)] bg-[var(--bg-panel-strong)] px-6 py-3">
          <div className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
            ISSUED · STATION OPS-04 · MMXXVI
          </div>
          <button
            type="button"
            onClick={onRequestAccessClick}
            className="group/cta inline-flex items-center gap-2 font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--accent-brass)] transition-colors hover:text-[var(--text-strong)]"
          >
            <span>REQUEST EARLY ACCESS</span>
            <Arrow />
          </button>
        </footer>
      </article>
    </motion.section>
  );
};

const CountUnit: FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex flex-col items-start gap-1 rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-panel-strong)] px-3 py-3 sm:px-4">
    <div
      className="font-display tracking-tight"
      style={{
        fontVariantNumeric: 'tabular-nums',
        fontSize: 'clamp(1.7rem, 5vw, 2.6rem)',
        lineHeight: 1,
        fontWeight: 500,
      }}
    >
      {value}
    </div>
    <div className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
      {label}
    </div>
  </div>
);

const DEPLOYMENT_STAGES: readonly {
  code: string;
  name: string;
  status: 'COMPLETE' | 'ACTIVE' | 'PENDING';
  detail: string;
}[] = [
  {
    code: 'STAGE I',
    name: 'STAGING',
    status: 'COMPLETE',
    detail: 'Internal Bureau review · cleared §3.1',
  },
  {
    code: 'STAGE II',
    name: 'CANARY',
    status: 'ACTIVE',
    detail: 'Founding roster · admitted by designation',
  },
  {
    code: 'STAGE III',
    name: 'PRIMETIME',
    status: 'PENDING',
    detail: 'Public filing line · opens on release',
  },
];

function stageTone(s: 'COMPLETE' | 'ACTIVE' | 'PENDING'): 'green' | 'brass' | 'neutral' {
  if (s === 'COMPLETE') return 'green';
  if (s === 'ACTIVE') return 'brass';
  return 'neutral';
}

function formatTarget(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} · ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}

const Arrow: FC = () => (
  <svg width="12" height="12" viewBox="0 0 14 14" aria-hidden="true">
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
