'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { BackgroundLayers } from '@/components/BackgroundLayers';
import { Button } from '@/components/Button';
import { FooterLoreStrip } from '@/components/FooterLoreStrip';
import { Navbar } from '@/components/Navbar';
import { pageView } from '@/lib/analytics';
import type { GalleryOpsSubmissionDetail } from '@/lib/farts-api-types';
import {
  approveAndPublishSubmission,
  fetchModerationQueue,
  moderateSubmission,
  type ModerationLabHeaders,
} from '@/lib/moderation-lab-api';
import { formatGallerySpecimenLabel } from '@/lib/gallery-specimen-label';

type QueueView = 'pending' | 'flagged';

const VIEW_STATUS: Record<QueueView, string> = {
  pending: 'submitted_for_review',
  flagged: 'reported',
};

function formatSubmittedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function QueueCard(props: {
  item: GalleryOpsSubmissionDetail;
  view: QueueView;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
  onRemove?: () => void;
}) {
  const { item, view, busy } = props;
  const label = formatGallerySpecimenLabel(item.id);

  return (
    <article
      className={[
        'rounded-md border border-[var(--border-subtle)]',
        'bg-[color-mix(in_oklab,var(--bg-panel)_85%,transparent)] p-5 backdrop-blur-sm',
      ].join(' ')}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[0.58rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
            {label}
          </p>
          <h2 className="mt-1 font-display text-xl text-[var(--text-primary)]">{item.report.fartName}</h2>
          <p className="mt-1 font-mono text-[0.65rem] text-[var(--text-muted)]">
            {item.report.classification} · power {item.report.powerScore}
          </p>
          <p className="mt-1 font-mono text-[0.6rem] text-[var(--text-faint)]">
            Waiting since {formatSubmittedAt(item.submittedAt)}
          </p>
        </div>
        {view === 'flagged' && item.openReportCount > 0 ? (
          <span className="rounded border border-[var(--accent-warning)]/40 px-2 py-1 font-mono text-[0.6rem] uppercase tracking-wide-2 text-[var(--accent-warning)]">
            {item.openReportCount} report{item.openReportCount === 1 ? '' : 's'}
          </span>
        ) : null}
      </header>

      <div className="mt-5 flex flex-wrap gap-3">
        {view === 'pending' ? (
          <>
            <Button type="button" disabled={busy} onClick={props.onApprove}>
              {busy ? 'Publishing…' : 'Approve'}
            </Button>
            <Button type="button" variant="secondary" disabled={busy} onClick={props.onReject}>
              Reject
            </Button>
          </>
        ) : (
          <Button type="button" variant="secondary" disabled={busy} onClick={() => props.onRemove?.()}>
            {busy ? 'Removing…' : 'Remove from feed'}
          </Button>
        )}
      </div>
    </article>
  );
}

/**
 * Internal moderation surface — simple approve / reject queue for the public feed.
 */
export function ModerationLabClient() {
  const [view, setView] = useState<QueueView>('pending');
  const [items, setItems] = useState<GalleryOpsSubmissionDetail[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    pageView('moderation_lab_view', {});
  }, []);

  const headers = useCallback((): ModerationLabHeaders => ({}), []);

  const onSignOut = useCallback(async () => {
    await fetch('/api/ops/auth', { method: 'DELETE' });
    window.location.href = '/ops/login?returnTo=/moderation-lab';
  }, []);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setStatus(null);
    try {
      const data = await fetchModerationQueue(VIEW_STATUS[view], headers());
      setItems(data.items);
    } catch (e) {
      setItems([]);
      setStatus(e instanceof Error ? e.message : 'Could not load queue');
    } finally {
      setLoading(false);
    }
  }, [headers, view]);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  const runAction = useCallback(
    async (submissionId: string, fn: () => Promise<unknown>, successMessage: string) => {
      setActingId(submissionId);
      setStatus(null);
      try {
        await fn();
        setStatus(successMessage);
        await loadQueue();
      } catch (e) {
        setStatus(e instanceof Error ? e.message : 'Action failed');
      } finally {
        setActingId(null);
      }
    },
    [loadQueue],
  );

  const onApprove = useCallback(
    (id: string) =>
      void runAction(id, () => approveAndPublishSubmission(id, headers()), 'Approved — now live on the public feed.'),
    [headers, runAction],
  );

  const onReject = useCallback(
    (id: string) =>
      void runAction(id, () => moderateSubmission(id, 'reject', headers()), 'Rejected — will not appear on the feed.'),
    [headers, runAction],
  );

  const onRemove = useCallback(
    (id: string) =>
      void runAction(id, () => moderateSubmission(id, 'remove', headers()), 'Removed from the public feed.'),
    [headers, runAction],
  );

  const pendingCount = view === 'pending' ? items.length : null;

  return (
    <>
      <BackgroundLayers />
      <div className="relative z-10 flex min-h-dvh flex-col">
        <Navbar />
        <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10 lg:px-10">
          <header className="mb-8">
            <p className="font-mono text-[0.65rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
              STAFF · MODERATION
            </p>
            <h1 className="mt-2 font-display text-3xl text-[var(--text-strong)]">Review public feed posts</h1>
            <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
              When someone taps &ldquo;Post to public feed,&rdquo; their specimen waits here.{' '}
              <strong className="font-medium text-[var(--text-primary)]">Approve</strong> puts it on the bulletin;{' '}
              <strong className="font-medium text-[var(--text-primary)]">Reject</strong> keeps it off.
            </p>
          </header>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setView('pending')}
              className={[
                'rounded-md border px-4 py-2 font-mono text-[0.65rem] uppercase tracking-wide-2 transition-colors',
                view === 'pending'
                  ? 'border-[var(--accent-brass)] bg-[var(--accent-brass)]/10 text-[var(--accent-brass)]'
                  : 'border-[var(--border-stark)] text-[var(--text-muted)] hover:border-[var(--accent-teal)]',
              ].join(' ')}
            >
              Waiting{pendingCount !== null && !loading ? ` (${pendingCount})` : ''}
            </button>
            <button
              type="button"
              onClick={() => setView('flagged')}
              className={[
                'rounded-md border px-4 py-2 font-mono text-[0.65rem] uppercase tracking-wide-2 transition-colors',
                view === 'flagged'
                  ? 'border-[var(--accent-brass)] bg-[var(--accent-brass)]/10 text-[var(--accent-brass)]'
                  : 'border-[var(--border-stark)] text-[var(--text-muted)] hover:border-[var(--accent-teal)]',
              ].join(' ')}
            >
              Flagged on feed
            </button>
            <Button type="button" variant="secondary" disabled={loading || actingId !== null} onClick={() => void loadQueue()}>
              Refresh
            </Button>
            <Link
              href="/feed"
              className="font-mono text-[0.65rem] uppercase tracking-wide-2 text-[var(--accent-brass)] underline-offset-2 hover:underline"
            >
              View public feed →
            </Link>
            <button
              type="button"
              onClick={() => void onSignOut()}
              className="font-mono text-[0.65rem] uppercase tracking-wide-2 text-[var(--text-faint)] underline-offset-2 hover:text-[var(--text-muted)] hover:underline"
            >
              Sign out
            </button>
          </div>

          {status ? (
            <p
              className={[
                'mt-4 rounded-md border px-3 py-2 font-mono text-xs',
                status.includes('live') || status.includes('Removed') || status.includes('Rejected')
                  ? 'border-[var(--accent-teal)]/40 text-[var(--accent-teal)]'
                  : 'border-dashed border-[var(--border-stark)] text-[var(--accent-warning)]',
              ].join(' ')}
              role="status"
            >
              {status}
            </p>
          ) : null}

          <section className="mt-8 space-y-4" aria-label="Moderation queue">
            {loading ? (
              <p className="font-mono text-sm text-[var(--text-muted)]">Loading queue…</p>
            ) : items.length === 0 ? (
              <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-panel)] px-5 py-8 text-center">
                <p className="font-display text-lg text-[var(--text-primary)]">
                  {view === 'pending' ? 'Nothing waiting' : 'Nothing flagged'}
                </p>
                <p className="mt-2 font-mono text-[0.7rem] text-[var(--text-muted)]">
                  {view === 'pending'
                    ? 'New “Post to public feed” submissions will show up here.'
                    : 'Community reports on live feed items appear here.'}
                </p>
              </div>
            ) : (
              items.map((item) => (
                <QueueCard
                  key={item.id}
                  item={item}
                  view={view}
                  busy={actingId === item.id}
                  onApprove={() => onApprove(item.id)}
                  onReject={() => onReject(item.id)}
                  onRemove={() => onRemove(item.id)}
                />
              ))
            )}
          </section>

        </main>
        <FooterLoreStrip />
      </div>
    </>
  );
}
