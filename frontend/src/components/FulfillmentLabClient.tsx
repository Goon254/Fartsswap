'use client';

import { useCallback, useEffect, useState } from 'react';
import { BackgroundLayers } from '@/components/BackgroundLayers';
import { Button } from '@/components/Button';
import { FooterLoreStrip } from '@/components/FooterLoreStrip';
import { Navbar } from '@/components/Navbar';
import { pageView } from '@/lib/analytics';

/**
 * Inspect mock POD orders and drive status transitions. Requires API
 * `POD_FULFILLMENT_ENABLED=true` for checkout-complete to create rows.
 */
export function FulfillmentLabClient() {
  const [opsKey, setOpsKey] = useState('');
  const [json, setJson] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [orderId, setOrderId] = useState('');
  const [webhookBody, setWebhookBody] = useState(
    JSON.stringify({ orderId: '', status: 'shipped', reason: 'lab_sim' }, null, 2),
  );
  const [statusBody, setStatusBody] = useState(JSON.stringify({ status: 'in_production' }, null, 2));

  useEffect(() => {
    pageView('fulfillment_lab_view', {});
  }, []);

  const headers = useCallback(() => {
    const h: Record<string, string> = {};
    if (opsKey.trim()) h['x-ops-key'] = opsKey.trim();
    return h;
  }, [opsKey]);

  const onList = useCallback(async () => {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch('/api/ops/fulfillment/orders?limit=30', { headers: headers() });
      const text = await res.text();
      setJson(text);
      if (!res.ok) setStatus(`List failed (${res.status})`);
    } finally {
      setBusy(false);
    }
  }, [headers]);

  const onDetail = useCallback(async () => {
    const id = orderId.trim();
    if (!id) {
      setStatus('Set order UUID.');
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/ops/fulfillment/orders/${encodeURIComponent(id)}`, { headers: headers() });
      const text = await res.text();
      setJson(text);
      if (!res.ok) setStatus(`Detail failed (${res.status})`);
    } finally {
      setBusy(false);
    }
  }, [headers, orderId]);

  const onOpsStatus = useCallback(async () => {
    const id = orderId.trim();
    if (!id) {
      setStatus('Set order UUID.');
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/ops/fulfillment/orders/${encodeURIComponent(id)}/status`, {
        method: 'POST',
        headers: { ...headers(), 'content-type': 'application/json' },
        body: statusBody,
      });
      const text = await res.text();
      setJson(text);
      if (!res.ok) setStatus(`Status POST failed (${res.status})`);
    } finally {
      setBusy(false);
    }
  }, [headers, orderId, statusBody]);

  const onWebhook = useCallback(async () => {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch('/api/fulfillment/webhooks/mock', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: webhookBody,
      });
      const text = await res.text();
      setJson(text);
      if (!res.ok) {
        setStatus(`Webhook failed (${res.status}) — align POD_WEBHOOK_SECRET on Next + API if required`);
      }
    } finally {
      setBusy(false);
    }
  }, [webhookBody]);

  return (
    <>
      <BackgroundLayers />
      <div className="relative z-10 flex min-h-dvh flex-col">
        <Navbar />
        <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10 lg:px-10">
          <header className="mb-8">
            <p className="font-mono text-[0.65rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
              INTERNAL · FULFILLMENT LAB
            </p>
            <h1 className="mt-2 font-display text-3xl text-[var(--text-strong)]">POD handoff</h1>
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              Checkout-complete stub calls the fulfillment bridge when{' '}
              <code className="text-[var(--accent-brass)]">POD_FULFILLMENT_ENABLED=true</code>. Provider is mock-only;
              real Printful/SPOD adapters plug into <code className="text-[var(--accent-brass)]">PodProviderPort</code>{' '}
              later.
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
            Order id
            <input
              className="mt-1 w-full rounded-md border border-[var(--border-stark)] bg-black/30 px-3 py-2 font-sans text-sm text-[var(--text-primary)]"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              autoComplete="off"
            />
          </label>

          <label className="mt-4 block font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
            Webhook POST body (Next forwards POD_WEBHOOK_SECRET when set server-side)
            <textarea
              className="mt-1 min-h-[100px] w-full rounded-md border border-[var(--border-stark)] bg-black/30 px-3 py-2 font-mono text-xs text-[var(--text-primary)]"
              value={webhookBody}
              onChange={(e) => setWebhookBody(e.target.value)}
            />
          </label>

          <label className="mt-4 block font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
            Ops status POST body
            <textarea
              className="mt-1 min-h-[60px] w-full rounded-md border border-[var(--border-stark)] bg-black/30 px-3 py-2 font-mono text-xs text-[var(--text-primary)]"
              value={statusBody}
              onChange={(e) => setStatusBody(e.target.value)}
            />
          </label>

          {status ? (
            <p className="mt-4 rounded-md border border-dashed border-[var(--border-stark)] px-3 py-2 font-mono text-xs text-[var(--accent-warning)]">
              {status}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <Button type="button" variant="secondary" disabled={busy} onClick={() => void onList()}>
              List orders
            </Button>
            <Button type="button" variant="secondary" disabled={busy} onClick={() => void onDetail()}>
              Order detail
            </Button>
            <Button type="button" variant="secondary" disabled={busy} onClick={() => void onWebhook()}>
              POST mock webhook
            </Button>
            <Button type="button" disabled={busy} onClick={() => void onOpsStatus()}>
              POST ops status
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
