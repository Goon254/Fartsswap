'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BackgroundLayers } from '@/components/BackgroundLayers';
import { Button } from '@/components/Button';
import { FooterLoreStrip } from '@/components/FooterLoreStrip';
import { Navbar } from '@/components/Navbar';
import { pageView, track } from '@/lib/analytics';
import { fetchSponsorshipResolve } from '@/lib/sponsorship-api';

const DEFAULT_SLOTS =
  'methane_index_powered_by,sponsored_badge,sponsored_challenge,sponsored_classification,sponsored_probable_cause';

/**
 * Internal sponsorship lab — preview resolve output, seed demo data, and
 * inspect fallback behaviour. Requires `x-ops-key` for mutating ops routes
 * (send header from browser devtools or configure `OPS_CONSOLE_SECRET` on
 * the Next server for local demos).
 */
export function SponsorLabClient() {
  const [slots, setSlots] = useState(DEFAULT_SLOTS);
  const [json, setJson] = useState<string>('');
  const [opsKey, setOpsKey] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    pageView('sponsor_lab_view', {});
  }, []);

  const slotList = useMemo(() => slots.split(',').map((s) => s.trim()).filter(Boolean), [slots]);

  const onResolve = useCallback(async () => {
    setBusy(true);
    setStatus(null);
    try {
      const placements = await fetchSponsorshipResolve(slotList);
      setJson(JSON.stringify({ placements: placements ?? [] }, null, 2));
      if (placements?.length) {
        void track('campaign_preview_rendered', { surface: 'sponsor_lab', mode: 'resolve' });
        void track('sponsored_inventory_served', {
          surface: 'sponsor_lab',
          slots: placements.map((p) => p.slotCode),
          placementIds: placements.map((p) => p.placementId),
        });
      }
    } finally {
      setBusy(false);
    }
  }, [slotList]);

  const onSeedDemo = useCallback(async () => {
    setBusy(true);
    setStatus(null);
    try {
      const headers: Record<string, string> = {};
      if (opsKey.trim()) headers['x-ops-key'] = opsKey.trim();
      const res = await fetch('/api/ops/sponsorship/seed-demo', { method: 'POST', headers });
      const text = await res.text();
      if (!res.ok) {
        setStatus(`Seed failed (${res.status}): ${text.slice(0, 200)}`);
        return;
      }
      setStatus('Demo campaign seeded — hit Resolve again.');
      setJson(text);
    } finally {
      setBusy(false);
    }
  }, [opsKey]);

  const onListCampaigns = useCallback(async () => {
    setBusy(true);
    setStatus(null);
    try {
      const headers: Record<string, string> = {};
      if (opsKey.trim()) headers['x-ops-key'] = opsKey.trim();
      const res = await fetch('/api/ops/sponsorship/campaigns', { headers });
      const text = await res.text();
      setJson(text);
      if (!res.ok) setStatus(`List failed (${res.status})`);
    } finally {
      setBusy(false);
    }
  }, [opsKey]);

  return (
    <>
      <BackgroundLayers />
      <div className="relative z-10 flex min-h-dvh flex-col">
        <Navbar />
        <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10 lg:px-10">
          <header className="mb-8">
            <p className="font-mono text-[0.65rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
              INTERNAL · SPONSOR LAB
            </p>
            <h1 className="mt-2 font-display text-3xl text-[var(--text-strong)]">Ceremonial inventory</h1>
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              Native sponsorship only — no banners, no score manipulation. Resolve reads active campaigns;
              ops routes require <code className="text-[var(--accent-brass)]">x-ops-key</code> matching the
              bureau API secret.
            </p>
          </header>

          <label className="block font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
            Slot csv
            <input
              className="mt-1 w-full rounded-md border border-[var(--border-stark)] bg-black/30 px-3 py-2 font-sans text-sm text-[var(--text-primary)]"
              value={slots}
              onChange={(e) => setSlots(e.target.value)}
            />
          </label>

          <label className="mt-4 block font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
            x-ops-key (optional — for seed / list; never commit real keys)
            <input
              className="mt-1 w-full rounded-md border border-[var(--border-stark)] bg-black/30 px-3 py-2 font-sans text-sm text-[var(--text-primary)]"
              value={opsKey}
              onChange={(e) => setOpsKey(e.target.value)}
              autoComplete="off"
            />
          </label>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button type="button" variant="secondary" disabled={busy} onClick={() => void onResolve()}>
              Resolve (public)
            </Button>
            <Button type="button" variant="ghost" disabled={busy} onClick={() => void onListCampaigns()}>
              List campaigns (ops)
            </Button>
            <Button type="button" variant="ghost" disabled={busy} onClick={() => void onSeedDemo()}>
              Seed demo campaign (ops)
            </Button>
          </div>

          {status ? <p className="mt-4 text-sm text-[var(--text-muted)]">{status}</p> : null}

          <pre className="mt-8 max-h-[480px] overflow-auto rounded-md border border-[var(--border-brass)] bg-black/40 p-4 font-mono text-[0.7rem] text-[var(--text-faint)]">
            {json || '— no payload yet —'}
          </pre>
        </main>
        <FooterLoreStrip />
      </div>
    </>
  );
}
