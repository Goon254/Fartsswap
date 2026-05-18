'use client';

import { motion } from 'framer-motion';
import type { FC } from 'react';
import { Chip } from '@/components/Chip';
import type { Challenge, ChallengePerspective } from '@/lib/challenge';
import { thresholdToBeat } from '@/lib/challenge';
import { getVariantById } from '@/lib/result-variants';

interface ChallengeNoticeProps {
  challenge: Challenge;
  perspective: ChallengePerspective;
}

const EASE = [0.22, 0.61, 0.36, 1] as const;

/**
 * Hero block for the /challenge page.
 *
 * Two perspectives share the same component so the URL can be opened by
 * either party without losing the visual identity:
 *
 *   recipient (default): "You have been invited to contest this
 *     classification." Sets up Accept as the dominant action.
 *
 *   sender (?from=mine): "Your dispute is ready to issue." Reframes around
 *     the Copy-link action and the "send to your nominee" instruction.
 *
 * Both modes share a top warning rail with dispute chips, so the visual
 * language matches the rest of the lab.
 */
export const ChallengeNotice: FC<ChallengeNoticeProps> = ({ challenge, perspective }) => {
  const variant = getVariantById(challenge.sourceVariantId);
  const threshold = thresholdToBeat(challenge);
  const isSender = perspective === 'sender';

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="mx-auto w-full max-w-7xl px-6 pt-6 lg:px-10 lg:pt-8"
    >
      {/* — Warning rail — */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-dashed border-[var(--border-stark)] bg-[color-mix(in_oklab,var(--bg-panel-strong)_85%,transparent)] px-4 py-3">
        <div className="flex items-center gap-3 font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
          <span aria-hidden="true" className="brand-rule h-px w-6 opacity-90" />
          <span className="text-[var(--accent-brass)]">DISPUTE NOTICE FILED</span>
          <span aria-hidden="true" className="hidden h-3 w-px bg-[var(--border-stark)] md:inline-block" />
          <span className="hidden md:inline">Bureau review remains provisional pending challenger evidence.</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Chip tone="amber" withDot>
            COUNTER-SUBMISSION AUTHORIZED
          </Chip>
          <Chip tone="brass">DOCKET · DKT-{shortId(challenge.challengeId)}</Chip>
        </div>
      </div>

      {/* — Title block — */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
        <div>
          <div className="flex items-center gap-3 font-mono text-[0.62rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
            <span aria-hidden="true" className="brand-rule h-px w-8 opacity-90" />
            <span className="rounded-sm border border-[var(--border-brass)] px-1.5 py-px text-[0.6rem]">
              §06
            </span>
            <span>{isSender ? 'OUTGOING DISPUTE · READY TO ISSUE' : 'INCOMING DISPUTE · UNDER REVIEW'}</span>
          </div>
          <h1
            className={[
              'mt-4 max-w-[22ch] font-display font-medium leading-[1.02] tracking-tight',
              'text-[var(--text-strong)] text-shadow-glow',
              'text-[2.4rem] sm:text-[3rem] md:text-[3.6rem] lg:text-[4rem]',
            ].join(' ')}
          >
            {isSender ? (
              <>
                A diagnostic event has been{' '}
                <span className="italic text-[var(--accent-brass)]">entered into dispute.</span>
              </>
            ) : (
              <>
                You have been invited to{' '}
                <span className="italic text-[var(--accent-brass)]">contest this classification.</span>
              </>
            )}
          </h1>
          <p className="mt-5 max-w-[56ch] text-[0.95rem] leading-relaxed text-[var(--text-default)]">
            {isSender ? (
              <>
                Your dossier <span className="text-[var(--text-strong)]">{variant.classification}</span>{' '}
                ({challenge.sourceScore}/100) has been queued as a contested ruling. Issue the link below
                to your nominee. Their counter-submission will be filed beneath your case for
                comparative review.
              </>
            ) : (
              <>
                The Bureau has logged the dossier{' '}
                <span className="text-[var(--text-strong)]">{variant.classification}</span> at{' '}
                <span className="text-[var(--text-strong)]">{challenge.sourceScore}/100</span>. You are
                authorised to enter a counter-submission. The Bureau\u2019s ruling remains provisional
                until a higher score or a rarer classification is recorded.
              </>
            )}
          </p>
        </div>

        {/* — Beat-this panel — */}
        <div className="flex flex-col gap-4 rounded-md border border-[var(--border-brass)] bg-[color-mix(in_oklab,var(--accent-brass)_6%,transparent)] p-6">
          <div className="flex items-center gap-3 font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
            <span aria-hidden="true" className="brand-rule h-px w-5 opacity-90" />
            <span>THRESHOLD FOR OVERTURN</span>
          </div>
          <div className="flex items-baseline gap-3 leading-none">
            <span className="font-display text-[5rem] tracking-tight text-[var(--text-strong)] sm:text-[6rem]">
              {String(threshold).padStart(2, '0')}
            </span>
            <span className="font-mono text-xs uppercase tracking-wide-2 text-[var(--text-muted)]">
              / 100
            </span>
          </div>
          <p className="text-sm leading-relaxed text-[var(--text-default)]">
            Score{' '}
            <span className="text-[var(--text-strong)]">at or above {threshold}</span> to overturn the
            ruling. A rarer classification (e.g.{' '}
            <span className="text-[var(--text-strong)]">Cerulean Event</span>) is also a winning
            counter-submission.
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <Chip tone="teal">METHANE INDEX · ACTIVE</Chip>
            <Chip tone="neutral">REVIEW · PROVISIONAL</Chip>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

function shortId(id: string): string {
  return id.replace(/^ch_/, '').slice(0, 4).toUpperCase() || '0000';
}
