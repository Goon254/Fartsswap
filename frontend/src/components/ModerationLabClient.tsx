'use client';

import { useCallback, useEffect, useState } from 'react';
import { BackgroundLayers } from '@/components/BackgroundLayers';
import { Button } from '@/components/Button';
import { FooterLoreStrip } from '@/components/FooterLoreStrip';
import { Navbar } from '@/components/Navbar';
import { pageView } from '@/lib/analytics';

/**
 * Internal moderation surface — queue, feed preview, and enforcement helpers.
 * Mutating ops routes require `x-ops-key` (browser field or `OPS_CONSOLE_SECRET` on Next).
 */
export function ModerationLabClient() {
  const [opsKey, setOpsKey] = useState('');
  const [opsActor, setOpsActor] = useState('operator');
  const [status, setStatus] = useState<string | null>(null);
  const [json, setJson] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [queueFilter, setQueueFilter] = useState('submitted_for_review');
  const [submissionId, setSubmissionId] = useState('');
  const [moderateBody, setModerateBody] = useState(
    JSON.stringify({ action: 'approve', notes: 'Looks bureau-safe.' }, null, 2),
  );
  const [reportBody, setReportBody] = useState(
    JSON.stringify({ submissionId: '', reasonCode: 'spam', details: '' }, null, 2),
  );
  const [submitBody, setSubmitBody] = useState(JSON.stringify({ reportId: '' }, null, 2));

  useEffect(() => {
    pageView('moderation_lab_view', {});
  }, []);

  const headers = useCallback(() => {
    const h: Record<string, string> = {};
    if (opsKey.trim()) h['x-ops-key'] = opsKey.trim();
    if (opsActor.trim()) h['x-ops-actor'] = opsActor.trim();
    return h;
  }, [opsKey, opsActor]);

  const onLoadQueue = useCallback(async () => {
    setBusy(true);
    setStatus(null);
    try {
      const u = new URL('/api/ops/gallery/queue', window.location.origin);
      u.searchParams.set('status', queueFilter);
      const res = await fetch(u.toString(), { headers: headers() });
      const text = await res.text();
      setJson(text);
      if (!res.ok) setStatus(`Queue load failed (${res.status})`);
    } finally {
      setBusy(false);
    }
  }, [headers, queueFilter]);

  const onLoadFeed = useCallback(async () => {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch('/api/gallery/feed?limit=12', { cache: 'no-store' });
      const text = await res.text();
      setJson(text);
      if (!res.ok) setStatus(`Feed failed (${res.status})`);
    } finally {
      setBusy(false);
    }
  }, []);

  const onModerate = useCallback(async () => {
    setBusy(true);
    setStatus(null);
    try {
      const id = submissionId.trim();
      if (!id) {
        setStatus('Set submission UUID first.');
        return;
      }
      const res = await fetch(`/api/ops/gallery/submissions/${encodeURIComponent(id)}/moderate`, {
        method: 'POST',
        headers: { ...headers(), 'content-type': 'application/json' },
        body: moderateBody,
      });
      const text = await res.text();
      setJson(text);
      if (!res.ok) setStatus(`Moderate failed (${res.status})`);
    } finally {
      setBusy(false);
    }
  }, [headers, moderateBody, submissionId]);

  const onDecisions = useCallback(async () => {
    setBusy(true);
    setStatus(null);
    try {
      const id = submissionId.trim();
      if (!id) {
        setStatus('Set submission UUID first.');
        return;
      }
      const res = await fetch(`/api/ops/gallery/submissions/${encodeURIComponent(id)}/decisions`, {
        headers: headers(),
      });
      const text = await res.text();
      setJson(text);
      if (!res.ok) setStatus(`Decisions failed (${res.status})`);
    } finally {
      setBusy(false);
    }
  }, [headers, submissionId]);

  const onFileReport = useCallback(async () => {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch('/api/gallery/reports', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: reportBody,
      });
      const text = await res.text();
      setJson(text);
      if (!res.ok) setStatus(`Report failed (${res.status})`);
    } finally {
      setBusy(false);
    }
  }, [reportBody]);

  const onSubmitOptIn = useCallback(async () => {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch('/api/gallery/submissions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: submitBody,
      });
      const text = await res.text();
      setJson(text);
      if (!res.ok) setStatus(`Submit failed (${res.status})`);
    } finally {
      setBusy(false);
    }
  }, [submitBody]);

  return (
    <>
      <BackgroundLayers />
      <div className="relative z-10 flex min-h-dvh flex-col">
        <Navbar />
        <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10 lg:px-10">
          <header className="mb-8">
            <p className="font-mono text-[0.65rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
              INTERNAL · MODERATION LAB
            </p>
            <h1 className="mt-2 font-display text-3xl text-[var(--text-strong)]">Gallery publication control</h1>
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              Opt-in submissions only. No comments, no follower graph, no raw-audio browsing in the feed payload.
              Approve → publish when ready; public listing stays off until{' '}
              <code className="text-[var(--accent-brass)]">GALLERY_PUBLIC_FEED_ENABLED=true</code> on the API.
            </p>
          </header>

          <label className="block font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
            x-ops-key (ops routes)
            <input
              className="mt-1 w-full rounded-md border border-[var(--border-stark)] bg-black/30 px-3 py-2 font-sans text-sm text-[var(--text-primary)]"
              value={opsKey}
              onChange={(e) => setOpsKey(e.target.value)}
              autoComplete="off"
            />
          </label>
          <label className="mt-3 block font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
            x-ops-actor (audit label, optional)
            <input
              className="mt-1 w-full rounded-md border border-[var(--border-stark)] bg-black/30 px-3 py-2 font-sans text-sm text-[var(--text-primary)]"
              value={opsActor}
              onChange={(e) => setOpsActor(e.target.value)}
              autoComplete="off"
            />
          </label>

          <label className="mt-4 block font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
            Queue status filter
            <input
              className="mt-1 w-full rounded-md border border-[var(--border-stark)] bg-black/30 px-3 py-2 font-sans text-sm text-[var(--text-primary)]"
              value={queueFilter}
              onChange={(e) => setQueueFilter(e.target.value)}
            />
          </label>

          <label className="mt-4 block font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
            Submission id (for moderate / decisions)
            <input
              className="mt-1 w-full rounded-md border border-[var(--border-stark)] bg-black/30 px-3 py-2 font-sans text-sm text-[var(--text-primary)]"
              value={submissionId}
              onChange={(e) => setSubmissionId(e.target.value)}
              autoComplete="off"
            />
          </label>

          <label className="mt-4 block font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
            Moderate JSON body
            <textarea
              className="mt-1 min-h-[120px] w-full rounded-md border border-[var(--border-stark)] bg-black/30 px-3 py-2 font-mono text-xs text-[var(--text-primary)]"
              value={moderateBody}
              onChange={(e) => setModerateBody(e.target.value)}
            />
          </label>

          <label className="mt-4 block font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
            Public report JSON (session cookie required — uses your browser session)
            <textarea
              className="mt-1 min-h-[100px] w-full rounded-md border border-[var(--border-stark)] bg-black/30 px-3 py-2 font-mono text-xs text-[var(--text-primary)]"
              value={reportBody}
              onChange={(e) => setReportBody(e.target.value)}
            />
          </label>

          <label className="mt-4 block font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
            Opt-in submission JSON (session cookie + you must own the report)
            <textarea
              className="mt-1 min-h-[80px] w-full rounded-md border border-[var(--border-stark)] bg-black/30 px-3 py-2 font-mono text-xs text-[var(--text-primary)]"
              value={submitBody}
              onChange={(e) => setSubmitBody(e.target.value)}
            />
          </label>

          {status ? (
            <p className="mt-4 rounded-md border border-dashed border-[var(--border-stark)] px-3 py-2 font-mono text-xs text-[var(--accent-warning)]">
              {status}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="button" variant="secondary" disabled={busy} onClick={() => void onLoadQueue()}>
              Load queue
            </Button>
            <Button type="button" variant="secondary" disabled={busy} onClick={() => void onLoadFeed()}>
              Preview public feed
            </Button>
            <Button type="button" variant="secondary" disabled={busy} onClick={() => void onDecisions()}>
              Decision log
            </Button>
            <Button type="button" disabled={busy} onClick={() => void onModerate()}>
              POST moderate
            </Button>
            <Button type="button" variant="secondary" disabled={busy} onClick={() => void onFileReport()}>
              POST public report
            </Button>
            <Button type="button" variant="secondary" disabled={busy} onClick={() => void onSubmitOptIn()}>
              POST opt-in submit
            </Button>
          </div>

          <pre className="mt-8 max-h-[480px] overflow-auto rounded-md border border-[var(--border-stark)] bg-black/40 p-4 font-mono text-[0.7rem] text-[var(--text-muted)]">
            {json || '—'}
          </pre>
        </main>
        <FooterLoreStrip />
      </div>
    </>
  );
}
