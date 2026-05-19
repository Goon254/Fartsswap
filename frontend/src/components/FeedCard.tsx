'use client';

import { useCallback, useState, type FC } from 'react';
import { FeedSpecimenReport } from '@/components/FeedSpecimenReport';
import { buildGalleryFeedAudioUrl } from '@/lib/gallery-api';
import type { GalleryPublicFeedItem } from '@/lib/farts-api-types';

interface FeedCardProps {
  item: GalleryPublicFeedItem;
}

export const FeedCard: FC<FeedCardProps> = ({ item }) => {
  const [audioError, setAudioError] = useState(false);
  const onAudioError = useCallback(() => setAudioError(true), []);
  const summary = [item.probableCause, item.emotionalTone].filter(Boolean).join(' · ');
  const audioSrc = item.audioAvailable ? buildGalleryFeedAudioUrl(item.submissionId) : null;

  return (
    <article
      className={[
        'rounded-md border border-[var(--border-subtle)]',
        'bg-[color-mix(in_oklab,var(--bg-panel)_80%,transparent)] p-4 backdrop-blur-sm',
      ].join(' ')}
    >
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="font-mono text-[0.58rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
            {item.specimenLabel}
          </p>
          <h2 className="mt-1 font-display text-lg text-[var(--text-primary)]">{item.fartName}</h2>
        </div>
        <div className="text-right font-mono text-[0.62rem] text-[var(--text-faint)]">
          <div>PWR {item.powerScore}</div>
          <div>{item.threatLevel}</div>
        </div>
      </header>

      {summary ? (
        <p className="mt-2 font-mono text-[0.68rem] leading-relaxed text-[var(--text-muted)]">
          {summary}
        </p>
      ) : null}

      <p className="mt-2 font-mono text-[0.6rem] uppercase tracking-wide-2 text-[var(--text-faint)]">
        {item.classification} · {item.threatLevel}
      </p>

      {audioSrc && !audioError ? (
        <audio
          controls
          preload="none"
          src={audioSrc}
          onError={onAudioError}
          className="mt-3 w-full max-w-md"
        >
          {item.audioContentType ? (
            <source src={audioSrc} type={item.audioContentType} />
          ) : null}
        </audio>
      ) : null}
      {!audioSrc || audioError ? (
        <p className="mt-3 font-mono text-[0.62rem] text-[var(--text-muted)]">
          {audioError
            ? 'This specimen is no longer available on the bulletin.'
            : 'Public audio unavailable for this specimen.'}
        </p>
      ) : null}

      <FeedSpecimenReport submissionId={item.submissionId} />
    </article>
  );
};
