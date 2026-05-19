'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, type FC } from 'react';
import { Button } from '@/components/Button';
import { track } from '@/lib/analytics';
import { FartsApiError } from '@/lib/report-from-recording-api';
import {
  fetchGallerySubmissionForReport,
  submitReportToGallery,
} from '@/lib/gallery-api';
import type { GallerySubmissionRow, GallerySubmissionStatus } from '@/lib/farts-api-types';

interface GalleryFeedSubmitProps {
  reportId: string;
}

function statusMessage(status: GallerySubmissionStatus | null, busy: boolean): string {
  if (busy) return 'Filing with the public feed desk…';
  switch (status) {
    case 'submitted_for_review':
      return 'Pending moderation — not public yet.';
    case 'approved':
      return 'Approved — awaiting operator publish to the bulletin.';
    case 'published':
      return 'Live on the public feed.';
    case 'reported':
      return 'Flagged for review — may be removed from the bulletin.';
    case 'rejected':
      return 'Not approved. You may post again from this dossier.';
    case 'removed':
      return 'Removed from the bulletin. You may post again.';
    default:
      return 'Opt in to post this dossier to the moderated public feed. Private replay stays on your report.';
  }
}

function canResubmit(status: GallerySubmissionStatus | null): boolean {
  return status === null || status === 'rejected' || status === 'removed';
}

export const GalleryFeedSubmit: FC<GalleryFeedSubmitProps> = ({ reportId }) => {
  const [submission, setSubmission] = useState<GallerySubmissionRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const row = await fetchGallerySubmissionForReport(reportId);
        if (!cancelled) {
          setSubmission(row);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setSubmission(null);
          setError(e instanceof Error ? e.message : 'Could not load feed status');
        }
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reportId]);

  const onSubmit = useCallback(async () => {
    setBusy(true);
    setError(null);
    track('gallery_feed_submit_clicked', { reportId });
    try {
      const row = await submitReportToGallery(reportId);
      setSubmission(row);
    } catch (e) {
      const msg =
        e instanceof FartsApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Submission failed';
      setError(msg);
    } finally {
      setBusy(false);
    }
  }, [reportId]);

  const status = submission?.status ?? null;
  const showSubmit = loaded && canResubmit(status) && !busy;
  const isLive = status === 'published' || status === 'reported';

  return (
    <section
      className={[
        'mx-auto w-full max-w-7xl px-6 lg:px-10',
        'rounded-md border border-[var(--border-subtle)]',
        'bg-[color-mix(in_oklab,var(--bg-panel)_75%,transparent)] px-5 py-4 backdrop-blur-md',
      ].join(' ')}
      aria-label="Public feed submission"
    >
      <div className="flex items-center gap-3 font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
        <span aria-hidden="true" className="brand-rule h-px w-6 opacity-90" />
        <span>§02c · PUBLIC FEED DESK</span>
      </div>
      <p className="mt-3 max-w-2xl font-mono text-[0.7rem] leading-relaxed text-[var(--text-muted)]">
        {statusMessage(status, busy)}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {showSubmit ? (
          <Button type="button" variant="secondary" disabled={busy} onClick={() => void onSubmit()}>
            {busy ? 'Submitting…' : 'Post to public feed'}
          </Button>
        ) : null}
        {isLive ? (
          <Link
            href="/feed"
            className="font-mono text-[0.65rem] uppercase tracking-wide-2 text-[var(--accent-brass)] underline-offset-2 hover:underline"
          >
            View public feed →
          </Link>
        ) : null}
      </div>
      {error ? (
        <p className="mt-2 font-mono text-[0.65rem] text-[var(--status-warn)]">{error}</p>
      ) : null}
    </section>
  );
};
