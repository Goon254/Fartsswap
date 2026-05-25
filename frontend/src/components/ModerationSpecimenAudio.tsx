'use client';

import { useCallback, useEffect, useState, type FC } from 'react';
import { buildModerationSubmissionAudioUrl } from '@/lib/moderation-lab-api';

interface ModerationSpecimenAudioProps {
  submissionId: string;
  playbackAvailable: boolean;
  audioContentType?: string;
}

/**
 * Staff-only replay for the moderation queue. Uses the ops gallery audio proxy
 * so moderators can hear specimens before approve/reject (no submitter session).
 */
export const ModerationSpecimenAudio: FC<ModerationSpecimenAudioProps> = ({
  submissionId,
  playbackAvailable,
  audioContentType,
}) => {
  const [error, setError] = useState(false);
  const onError = useCallback(() => setError(true), []);

  useEffect(() => {
    setError(false);
  }, [submissionId]);

  if (!playbackAvailable || error) {
    return (
      <div className="mt-4 rounded-sm border border-dashed border-[var(--border-stark)] bg-[var(--bg-panel-strong)] px-3 py-3">
        <p className="font-mono text-[0.58rem] uppercase tracking-wide-3 text-[var(--text-muted)]">
          Specimen audio
        </p>
        <p className="mt-1 font-mono text-[0.65rem] text-[var(--text-faint)]">
          {error
            ? 'Playback failed — sign in at /ops/login or the raw capture may have been purged.'
            : 'No playable capture for this dossier (demo report or audio deleted).'}
        </p>
      </div>
    );
  }

  const src = buildModerationSubmissionAudioUrl(submissionId);

  return (
    <div className="mt-4 rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-panel-strong)] px-3 py-3">
      <p className="font-mono text-[0.58rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
        Hear specimen · staff replay
      </p>
      <audio
        controls
        preload="metadata"
        src={src}
        onError={onError}
        className="mt-2 w-full max-w-md"
      >
        {audioContentType ? <source src={src} type={audioContentType} /> : null}
      </audio>
      <p className="mt-2 font-mono text-[0.62rem] text-[var(--text-faint)]">
        Listen before approving. Not shared publicly until you publish.
      </p>
    </div>
  );
};
