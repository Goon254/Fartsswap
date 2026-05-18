'use client';

import { useCallback, useEffect, useState } from 'react';
import { BackgroundLayers } from '@/components/BackgroundLayers';
import { Button } from '@/components/Button';
import { FooterLoreStrip } from '@/components/FooterLoreStrip';
import { Navbar } from '@/components/Navbar';
import { pageView } from '@/lib/analytics';

export function PlansLabClient() {
  const [opsKey, setOpsKey] = useState('');
  const [json, setJson] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState('');
  const [assignBody, setAssignBody] = useState(
    JSON.stringify({ sessionId: '', planCode: 'creator_plan', periodDays: 30 }, null, 2),
  );
  const [subId, setSubId] = useState('');
  const [simulateBody, setSimulateBody] = useState(JSON.stringify({ action: 'renew' }, null, 2));

  useEffect(() => {
    pageView('plans_lab_view', {});
  }, []);

  const headers = useCallback(() => {
    const h: Record<string, string> = {};
    if (opsKey.trim()) h['x-ops-key'] = opsKey.trim();
    return h;
  }, [opsKey]);

  const onCatalog = useCallback(async () => {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch('/api/ops/plans/catalog', { headers: headers() });
      setJson(await res.text());
      if (!res.ok) setStatus(`Catalog failed (${res.status})`);
    } finally {
      setBusy(false);
    }
  }, [headers]);

  const onAssign = useCallback(async () => {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch('/api/ops/plans/assign-test', {
        method: 'POST',
        headers: { ...headers(), 'content-type': 'application/json' },
        body: assignBody,
      });
      setJson(await res.text());
      if (!res.ok) setStatus(`Assign failed (${res.status})`);
    } finally {
      setBusy(false);
    }
  }, [assignBody, headers]);

  const onEntitlements = useCallback(async () => {
    const id = sessionId.trim();
    if (!id) {
      setStatus('Set session UUID.');
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/ops/plans/sessions/${encodeURIComponent(id)}/entitlements`, {
        headers: headers(),
      });
      setJson(await res.text());
      if (!res.ok) setStatus(`Entitlements failed (${res.status})`);
    } finally {
      setBusy(false);
    }
  }, [headers, sessionId]);

  const onBillingEvents = useCallback(async () => {
    const id = subId.trim();
    if (!id) {
      setStatus('Set subscription UUID for billing events.');
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/ops/plans/subscriptions/${encodeURIComponent(id)}/billing-events`, {
        headers: headers(),
      });
      setJson(await res.text());
      if (!res.ok) setStatus(`Billing events failed (${res.status})`);
    } finally {
      setBusy(false);
    }
  }, [headers, subId]);

  const onSimulate = useCallback(async () => {
    const id = subId.trim();
    if (!id) {
      setStatus('Set subscription UUID for simulate.');
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/ops/plans/subscriptions/${encodeURIComponent(id)}/simulate`, {
        method: 'POST',
        headers: { ...headers(), 'content-type': 'application/json' },
        body: simulateBody,
      });
      setJson(await res.text());
      if (!res.ok) setStatus(`Simulate failed (${res.status})`);
    } finally {
      setBusy(false);
    }
  }, [headers, simulateBody, subId]);

  return (
    <>
      <BackgroundLayers />
      <div className="relative z-10 flex min-h-dvh flex-col">
        <Navbar />
        <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10 lg:px-10">
          <header className="mb-8">
            <p className="font-mono text-[0.65rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
              INTERNAL · PLANS LAB
            </p>
            <h1 className="mt-2 font-display text-3xl text-[var(--text-strong)]">Creator entitlements</h1>
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              Operator-only test assignment. Core classify stays free; batch minting respects{' '}
              <code className="text-[var(--accent-brass)]">CREATOR_ENTITLEMENT_ENFORCEMENT</code> on the API.
            </p>
          </header>

          <label className="block font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
            x-ops-key
            <input
              className="mt-1 w-full rounded-md border border-[var(--border-stark)] bg-black/30 px-3 py-2 font-sans text-sm text-[var(--text-primary)]"
              value={opsKey}
              onChange={(e) => setOpsKey(e.target.value)}
              autoComplete="off"
            />
          </label>

          <label className="mt-4 block font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
            Session id (for entitlements)
            <input
              className="mt-1 w-full rounded-md border border-[var(--border-stark)] bg-black/30 px-3 py-2 font-sans text-sm text-[var(--text-primary)]"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              autoComplete="off"
            />
          </label>

          <label className="mt-4 block font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
            Subscription id (billing + simulate)
            <input
              className="mt-1 w-full rounded-md border border-[var(--border-stark)] bg-black/30 px-3 py-2 font-sans text-sm text-[var(--text-primary)]"
              value={subId}
              onChange={(e) => setSubId(e.target.value)}
              autoComplete="off"
            />
          </label>

          <label className="mt-4 block font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
            Assign-test JSON
            <textarea
              className="mt-1 min-h-[100px] w-full rounded-md border border-[var(--border-stark)] bg-black/30 px-3 py-2 font-mono text-xs text-[var(--text-primary)]"
              value={assignBody}
              onChange={(e) => setAssignBody(e.target.value)}
            />
          </label>

          <label className="mt-4 block font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
            Simulate JSON
            <textarea
              className="mt-1 min-h-[60px] w-full rounded-md border border-[var(--border-stark)] bg-black/30 px-3 py-2 font-mono text-xs text-[var(--text-primary)]"
              value={simulateBody}
              onChange={(e) => setSimulateBody(e.target.value)}
            />
          </label>

          {status ? (
            <p className="mt-4 rounded-md border border-dashed border-[var(--border-stark)] px-3 py-2 font-mono text-xs text-[var(--accent-warning)]">
              {status}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="button" variant="secondary" disabled={busy} onClick={() => void onCatalog()}>
              Catalog
            </Button>
            <Button type="button" disabled={busy} onClick={() => void onAssign()}>
              Assign test plan
            </Button>
            <Button type="button" variant="secondary" disabled={busy} onClick={() => void onEntitlements()}>
              Session entitlements
            </Button>
            <Button type="button" variant="secondary" disabled={busy} onClick={() => void onBillingEvents()}>
              Billing events
            </Button>
            <Button type="button" variant="secondary" disabled={busy} onClick={() => void onSimulate()}>
              Simulate lifecycle
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
