'use client';

import Link from 'next/link';
import { useCallback, useMemo, useRef, useState, type FC, type RefObject } from 'react';
import { Button } from '@/components/Button';
import { ChallengeSpecimenAudio } from '@/components/ChallengeSpecimenAudio';
import {
  buildChallengeChallengerAudioUrl,
  buildChallengeResponseAudioUrl,
} from '@/lib/challenge-api';
import { computeChallengeVerdict, type ChallengeVerdictOutcome } from '@/lib/challenge-verdict';
import type { ChallengePerspective } from '@/lib/challenge';
import type { ChallengeReportSummaryDto } from '@/lib/farts-api-types';

interface ChallengeVerdictPanelProps {
  challengeId: string;
  perspective: ChallengePerspective;
  challenger?: ChallengeReportSummaryDto;
  response?: ChallengeReportSummaryDto;
  copyableLink: string;
}

export const ChallengeVerdictPanel: FC<ChallengeVerdictPanelProps> = ({
  challengeId,
  perspective,
  challenger,
  response,
  copyableLink,
}) => {
  const isChallengerView = perspective === 'sender';
  const [copyPhase, setCopyPhase] = useState<'idle' | 'saved' | 'error'>('idle');
  const challengerAudioRef = useRef<HTMLAudioElement>(null);
  const responseAudioRef = useRef<HTMLAudioElement>(null);

  const verdict = useMemo(() => {
    if (challenger == null || response == null) return null;
    return computeChallengeVerdict(challenger, response);
  }, [challenger, response]);

  const pauseSiblingAudio = useCallback((active: 'challenger' | 'response') => {
    if (active !== 'challenger') challengerAudioRef.current?.pause();
    if (active !== 'response') responseAudioRef.current?.pause();
  }, []);

  const onCopy = useCallback(async () => {
    try {
      const fullUrl =
        typeof window !== 'undefined' && copyableLink.startsWith('/')
          ? window.location.origin + copyableLink
          : copyableLink;
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(fullUrl);
      }
      setCopyPhase('saved');
      window.setTimeout(() => setCopyPhase('idle'), 1800);
    } catch {
      setCopyPhase('error');
      window.setTimeout(() => setCopyPhase('idle'), 2200);
    }
  }, [copyableLink]);

  return (
    <section className="mx-auto w-full max-w-7xl space-y-6 px-6 lg:px-10">
      <header>
        <p className="font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
          §08 · VERDICT FILED
        </p>
        <h2 className="mt-2 font-display text-2xl text-[var(--text-primary)]">
          {isChallengerView ? 'Verdict on record' : 'Counter-submission on record'}
        </h2>
        <p className="mt-2 max-w-xl font-mono text-[0.7rem] text-[var(--text-muted)]">
          {isChallengerView
            ? 'Your rival responded. Review both specimens and the Bureau ruling below. This same link is your permanent re-entry URL.'
            : 'Copy this challenge link for the challenger so they can hear your specimen and compare scores.'}
        </p>
      </header>

      {verdict ? <VerdictBanner verdict={verdict} /> : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {challenger ? (
          <SpecimenSummary
            label="Challenger"
            summary={challenger}
            challengeId={challengeId}
            role="challenger"
            highlight={verdict?.outcome === 'challenger_wins'}
            audioRef={challengerAudioRef}
            onPlay={() => pauseSiblingAudio('challenger')}
          />
        ) : null}
        {response ? (
          <SpecimenSummary
            label="Counter-specimen"
            summary={response}
            challengeId={challengeId}
            role="response"
            highlight={verdict?.outcome === 'response_wins'}
            audioRef={responseAudioRef}
            onPlay={() => pauseSiblingAudio('response')}
          />
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="primary" onClick={() => void onCopy()}>
          {copyPhase === 'saved'
            ? 'Link copied'
            : copyPhase === 'error'
              ? 'Try again'
              : isChallengerView
                ? 'Copy challenge link'
                : 'Copy challenge link'}
        </Button>
        <Link
          href={`/report?reportId=${encodeURIComponent(response?.reportId ?? '')}`}
          className="inline-flex items-center font-mono text-[0.65rem] uppercase tracking-wide-2 text-[var(--accent-brass)] underline-offset-2 hover:underline"
        >
          View your dossier →
        </Link>
      </div>
    </section>
  );
};

const VerdictBanner: FC<{
  verdict: { outcome: ChallengeVerdictOutcome; headline: string; subline: string };
}> = ({ verdict }) => (
  <div
    className={[
      'rounded-md border px-5 py-4',
      verdict.outcome === 'tie'
        ? 'border-[var(--border-subtle)] bg-[color-mix(in_oklab,var(--bg-panel)_90%,transparent)]'
        : 'border-[var(--border-brass)] bg-[color-mix(in_oklab,var(--accent-brass)_12%,var(--bg-panel))]',
    ].join(' ')}
    role="status"
  >
    <p className="font-display text-xl text-[var(--text-primary)]">{verdict.headline}</p>
    <p className="mt-2 font-mono text-[0.7rem] leading-relaxed text-[var(--text-muted)]">
      {verdict.subline}
    </p>
  </div>
);

const SpecimenSummary: FC<{
  label: string;
  summary: ChallengeReportSummaryDto;
  challengeId: string;
  role: 'challenger' | 'response';
  highlight?: boolean;
  audioRef: RefObject<HTMLAudioElement | null>;
  onPlay: () => void;
}> = ({ label, summary, challengeId, role, highlight, audioRef, onPlay }) => {
  const audioSrc =
    summary.playbackAvailable && role === 'challenger'
      ? buildChallengeChallengerAudioUrl(challengeId)
      : summary.playbackAvailable && role === 'response'
        ? buildChallengeResponseAudioUrl(challengeId)
        : null;

  return (
    <article
      className={[
        'rounded-md border bg-[var(--bg-panel)] p-4',
        highlight
          ? 'border-[var(--border-brass)]'
          : 'border-[var(--border-subtle)]',
      ].join(' ')}
    >
      <p className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
        {label}
      </p>
      <h3 className="mt-1 font-display text-lg text-[var(--text-primary)]">{summary.fartName}</h3>
      <p className="mt-2 font-mono text-[0.68rem] text-[var(--text-muted)]">
        {[summary.probableCause, summary.emotionalTone].filter(Boolean).join(' · ')}
      </p>
      <p className="mt-2 font-mono text-[0.6rem] uppercase text-[var(--text-faint)]">
        PWR {summary.powerScore} · {summary.classification} · {summary.threatLevel}
      </p>
      {audioSrc ? (
        <ChallengeSpecimenAudio
          label="Hear specimen"
          src={audioSrc}
          audioContentType={summary.audioContentType}
          audioRef={audioRef}
          onPlay={onPlay}
        />
      ) : null}
    </article>
  );
};
