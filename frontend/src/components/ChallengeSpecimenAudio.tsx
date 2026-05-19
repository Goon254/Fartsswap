'use client';

import { useCallback, useState, type FC, type RefObject } from 'react';

interface ChallengeSpecimenAudioProps {
  label: string;
  src: string;
  audioContentType?: string;
  audioRef?: RefObject<HTMLAudioElement | null>;
  /** Fired when this element starts playback; parent may pause sibling players. */
  onPlay?: () => void;
}

export const ChallengeSpecimenAudio: FC<ChallengeSpecimenAudioProps> = ({
  label,
  src,
  audioContentType,
  audioRef,
  onPlay,
}) => {
  const [error, setError] = useState(false);
  const onError = useCallback(() => setError(true), []);

  return (
    <div className="mt-3 rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-panel-strong)] px-3 py-3">
      <p className="font-mono text-[0.55rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
        {label}
      </p>
      <audio
        ref={audioRef}
        controls
        preload="none"
        src={src}
        onPlay={onPlay}
        onError={onError}
        className="mt-2 w-full max-w-md"
      >
        {audioContentType ? <source src={src} type={audioContentType} /> : null}
      </audio>
      {error ? (
        <p className="mt-2 font-mono text-[0.62rem] text-[var(--text-muted)]">
          Specimen audio unavailable.
        </p>
      ) : null}
    </div>
  );
};
