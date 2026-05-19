'use client';

import { useCallback, useState, type FC } from 'react';
import { Button } from '@/components/Button';
import { track } from '@/lib/analytics';
import { fileGalleryFeedReport } from '@/lib/gallery-api';
import {
  GALLERY_REPORT_REASON_LABELS,
  GALLERY_USER_REPORT_REASONS,
  type GalleryUserReportReason,
} from '@/lib/gallery-report-reasons';
import { FartsApiError } from '@/lib/report-from-recording-api';

interface FeedSpecimenReportProps {
  submissionId: string;
}

export const FeedSpecimenReport: FC<FeedSpecimenReportProps> = ({ submissionId }) => {
  const [open, setOpen] = useState(false);
  const [reasonCode, setReasonCode] = useState<GalleryUserReportReason>('policy_other');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = useCallback(async () => {
    setBusy(true);
    setError(null);
    track('gallery_feed_report_clicked', { submissionId, reasonCode });
    try {
      await fileGalleryFeedReport({ submissionId, reasonCode, details });
      setDone(true);
      setOpen(false);
      track('gallery_report_filed', { submissionId, reasonCode });
    } catch (e) {
      if (e instanceof FartsApiError && e.status === 409) {
        setDone(true);
        setError('You already reported this specimen.');
      } else {
        setError(e instanceof Error ? e.message : 'Could not file report');
      }
    } finally {
      setBusy(false);
    }
  }, [submissionId, reasonCode, details]);

  if (done && !error) {
    return (
      <p className="mt-3 font-mono text-[0.62rem] text-[var(--text-muted)]">
        Report filed — the bureau will review. Thank you.
      </p>
    );
  }

  return (
    <div className="mt-3 border-t border-[var(--border-subtle)] pt-3">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="font-mono text-[0.6rem] uppercase tracking-wide-2 text-[var(--text-faint)] underline-offset-2 hover:text-[var(--text-muted)] hover:underline"
        >
          Report specimen
        </button>
      ) : (
        <div className="space-y-2">
          <p className="font-mono text-[0.58rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
            Flag for moderation
          </p>
          <label className="block">
            <span className="sr-only">Reason</span>
            <select
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value as GalleryUserReportReason)}
              disabled={busy}
              className="w-full rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-panel-strong)] px-2 py-1.5 font-mono text-[0.68rem] text-[var(--text-default)]"
            >
              {GALLERY_USER_REPORT_REASONS.map((code) => (
                <option key={code} value={code}>
                  {GALLERY_REPORT_REASON_LABELS[code]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="sr-only">Optional details</span>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              disabled={busy}
              maxLength={500}
              rows={2}
              placeholder="Optional details (max 500 chars)"
              className="w-full resize-none rounded-sm border border-[var(--border-subtle)] bg-[var(--bg-panel-strong)] px-2 py-1.5 font-mono text-[0.68rem] text-[var(--text-default)] placeholder:text-[var(--text-faint)]"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" disabled={busy} onClick={() => void onSubmit()}>
              {busy ? 'Sending…' : 'Submit report'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={busy}
              onClick={() => {
                setOpen(false);
                setError(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
      {error ? (
        <p className="mt-2 font-mono text-[0.62rem] text-[var(--status-warn)]">{error}</p>
      ) : null}
      {!open && !done ? (
        <p className="mt-1 font-mono text-[0.55rem] text-[var(--text-faint)]">
          No account required. One report per browser session per specimen.
        </p>
      ) : null}
    </div>
  );
};
