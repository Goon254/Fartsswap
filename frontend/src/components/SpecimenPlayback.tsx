'use client';

import { useCallback, useEffect, useState, type FC } from 'react';
import { buildReportAudioPlaybackUrl } from '@/lib/report-from-recording-api';

interface SpecimenPlaybackProps {
  reportId: string;
  audioContentType?: string;
}

/**
 * Private replay of the session-owned capture. Hidden when the API reports
 * playback unavailable (deleted audio, wrong session, or demo/fake dossier).
 */
export const SpecimenPlayback: FC<SpecimenPlaybackProps> = ({ reportId, audioContentType }) => {
  const [status, setStatus] = useState<'idle' | 'error'>('idle');
  const src = buildReportAudioPlaybackUrl(reportId);

  const onError = useCallback(() => {
    setStatus('error');
  }, []);

  useEffect(() => {
    setStatus('idle');
  }, [reportId]);

  return (
    <section
      className={[
        'mx-auto w-full max-w-7xl px-6 lg:px-10',
        'rounded-md border border-[var(--border-subtle)]',
        'bg-[color-mix(in_oklab,var(--bg-panel)_75%,transparent)] px-5 py-4 backdrop-blur-md',
      ].join(' ')}
      aria-label="Specimen playback"
    >
      <div className="flex items-center gap-3 font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
        <span aria-hidden="true" className="brand-rule h-px w-6 opacity-90" />
        <span>§02b · HEAR YOUR SPECIMEN</span>
      </div>
      <audio
        controls
        preload="metadata"
        src={src}
        onError={onError}
        className="mt-3 w-full max-w-md"
      >
        {audioContentType ? <source src={src} type={audioContentType} /> : null}
      </audio>
      {status === 'error' ? (
        <p className="mt-2 font-mono text-[0.65rem] text-[var(--text-muted)]">
          Playback unavailable — the raw specimen may have been purged from the chamber archive.
        </p>
      ) : (
        <p className="mt-2 font-mono text-[0.65rem] text-[var(--text-faint)]">
          Session-private replay. Not filed for public distribution.
        </p>
      )}
    </section>
  );
};
