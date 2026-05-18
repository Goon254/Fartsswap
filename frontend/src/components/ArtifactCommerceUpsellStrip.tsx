'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/Button';
import { track } from '@/lib/analytics';
import {
  completeCommerceCheckoutStub,
  createCommerceIntent,
  fetchCommerceThemes,
  fetchMerchBundle,
  prepareCommerceCheckout,
  previewCertificate,
  transitionCommerceIntent,
  type PremiumArtifactThemeDto,
} from '@/lib/artifact-commerce-api';
import type { PremiumIntent } from '@/lib/artifact-commerce-types';

export interface ArtifactCommerceUpsellStripProps {
  reportId: string;
  variantId?: string;
  sourceSurface: 'report' | 'wrapped' | 'creator';
}

function formatUsd(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

/**
 * Post-generation premium upsell: themes, certificate preview, checkout prep,
 * merch bundle export — only rendered when a real `reportId` is available.
 */
export function ArtifactCommerceUpsellStrip({
  reportId,
  variantId,
  sourceSurface,
}: ArtifactCommerceUpsellStripProps) {
  const [themes, setThemes] = useState<readonly PremiumArtifactThemeDto[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [selectedCode, setSelectedCode] = useState<string>('');
  const [intent, setIntent] = useState<PremiumIntent | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [bundleJson, setBundleJson] = useState<string | null>(null);
  const viewedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const list = await fetchCommerceThemes();
      if (cancelled) return;
      if (!list) {
        setLoadError(true);
        return;
      }
      setThemes(list);
      setSelectedCode(list[0]?.code ?? '');
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (viewedRef.current) return;
    if (!themes || themes.length === 0) return;
    viewedRef.current = true;
    void track('premium_offer_viewed', {
      offerId: 'artifact_commerce_strip',
      offerType: 'pdf_certificate',
      variantId: variantId ?? 'unknown',
      position: 0,
      reportId,
      surface: sourceSurface,
    });
  }, [themes, variantId, reportId, sourceSurface]);

  const selectedTheme = useMemo(
    () => themes?.find((t) => t.code === selectedCode) ?? themes?.[0],
    [themes, selectedCode],
  );

  const onStartPath = useCallback(async () => {
    if (!selectedTheme) return;
    setBusy(true);
    setStatus(null);
    setBundleJson(null);
    try {
      const created = await createCommerceIntent({
        reportId,
        sourceSurface,
        ...(variantId !== undefined ? { variantId } : {}),
      });
      if (!created) {
        setStatus('Could not create commerce intent (session or report mismatch).');
        return;
      }
      await transitionCommerceIntent(created.id, { targetState: 'offer_presented' });
      const updated = await transitionCommerceIntent(created.id, {
        targetState: 'theme_selected',
        commerceThemeCode: selectedTheme.code,
        productSku: selectedTheme.productSkus.officialPdf,
      });
      if (!updated) {
        setStatus('Theme selection failed.');
        return;
      }
      setIntent(updated);
      void track('premium_theme_selected', {
        commerceThemeCode: selectedTheme.code,
        intentId: updated.id,
        reportId,
        surface: sourceSurface,
      });
      setStatus('Theme locked — preview a certificate or run the mock checkout.');
    } finally {
      setBusy(false);
    }
  }, [reportId, selectedTheme, sourceSurface, variantId]);

  const onPreview = useCallback(
    async (kind: 'official_pdf' | 'wall_print') => {
      if (!intent) {
        setStatus('Start the upgrade path first.');
        return;
      }
      setBusy(true);
      try {
        const res = await previewCertificate(intent.id, kind);
        if (!res) {
          setStatus('Certificate preview failed.');
          return;
        }
        void track('certificate_previewed', {
          intentId: intent.id,
          certificateKind: kind,
          reportId,
        });
        setStatus(
          `Preview generated — artifact ${res.contentUrl} (open via bureau API host in dev, or wire a Next proxy).`,
        );
      } finally {
        setBusy(false);
      }
    },
    [intent, reportId],
  );

  const onMockCheckout = useCallback(async () => {
    if (!intent) {
      setStatus('Start the upgrade path first.');
      return;
    }
    setBusy(true);
    try {
      const prep = await prepareCommerceCheckout(intent.id);
      if (!prep) {
        setStatus('Checkout prep failed.');
        return;
      }
      void track('checkout_started', { intentId: intent.id, reportId });
      const done = await completeCommerceCheckoutStub(intent.id);
      if (!done) {
        setStatus('Checkout completion failed.');
        return;
      }
      void track('checkout_completed', { intentId: intent.id, reportId });
      void track('artifact_fulfilled', { intentId: intent.id, reportId });
      setIntent(done);
      setStatus('Mock checkout complete — fulfillment ref on intent (see network JSON).');
    } finally {
      setBusy(false);
    }
  }, [intent, reportId]);

  const onMerchBundle = useCallback(async () => {
    if (!intent) {
      setStatus('Start the upgrade path first.');
      return;
    }
    setBusy(true);
    try {
      const bundle = await fetchMerchBundle(intent.id);
      if (!bundle) {
        setStatus('Merch bundle export failed (lifecycle must pass theme selection).');
        return;
      }
      setBundleJson(JSON.stringify(bundle, null, 2));
      setStatus('Merch-ready bundle JSON loaded below.');
    } finally {
      setBusy(false);
    }
  }, [intent]);

  if (loadError) {
    return (
      <section className="mx-auto mt-10 w-full max-w-7xl px-6 lg:px-10" aria-label="Premium upgrade">
        <p className="rounded-md border border-[var(--border-brass)] bg-black/20 px-4 py-3 font-mono text-[0.7rem] text-[var(--text-faint)]">
          Bureau commerce catalog unavailable — check API proxy and session cookie.
        </p>
      </section>
    );
  }

  if (!themes || themes.length === 0) return null;

  return (
    <section
      className="mx-auto mt-10 w-full max-w-7xl px-6 lg:px-10"
      aria-label="Artifact commerce upgrade"
    >
      <div className="rounded-lg border border-[var(--border-brass)] bg-[var(--surface-void)]/40 p-5 shadow-[0_0_40px_rgba(0,0,0,0.25)]">
        <header className="mb-4 flex flex-wrap items-center gap-3">
          <span aria-hidden="true" className="brand-rule h-px w-8 opacity-90" />
          <span className="rounded-sm border border-[var(--border-brass)] px-1.5 py-px font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
            §COMMERCE
          </span>
          <span className="font-mono text-[0.65rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
            POST-FILING UPGRADE · OPTIONAL
          </span>
          <span aria-hidden="true" className="brand-rule h-px flex-1 opacity-40" />
        </header>
        <p className="mb-4 max-w-3xl text-sm leading-relaxed text-[var(--text-muted)]">
          The dossier above is complete. If you want the filing to look even more official: pick a premium theme,
          preview a certificate PDF, or export a merch-ready bundle for print-on-demand.
        </p>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <label className="flex min-w-[14rem] flex-1 flex-col gap-1 font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
            Premium theme
            <select
              className="rounded-md border border-[var(--border-brass)] bg-black/30 px-3 py-2 text-sm text-[var(--text-primary)]"
              value={selectedCode}
              onChange={(e) => setSelectedCode(e.target.value)}
              disabled={busy || Boolean(intent)}
            >
              {themes.map((t) => (
                <option key={t.code} value={t.code}>
                  {t.displayName} · {formatUsd(t.priceCents)}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" disabled={busy || Boolean(intent)} onClick={() => void onStartPath()}>
              Start upgrade path
            </Button>
            <Button type="button" variant="ghost" disabled={busy || !intent} onClick={() => void onPreview('official_pdf')}>
              Preview official PDF
            </Button>
            <Button type="button" variant="ghost" disabled={busy || !intent} onClick={() => void onPreview('wall_print')}>
              Preview wall layout
            </Button>
            <Button type="button" variant="ghost" disabled={busy || !intent} onClick={() => void onMockCheckout()}>
              Mock checkout
            </Button>
            <Button type="button" variant="ghost" disabled={busy || !intent} onClick={() => void onMerchBundle()}>
              Merch bundle JSON
            </Button>
          </div>
        </div>
        {intent ? (
          <p className="mt-3 font-mono text-[0.65rem] text-[var(--text-faint)]">
            Intent <span className="text-[var(--accent-brass)]">{intent.id}</span> · lifecycle{' '}
            <span className="text-[var(--accent-brass)]">{intent.lifecycleState}</span>
            {intent.commerceThemeCode ? (
              <>
                {' '}
                · theme <span className="text-[var(--accent-brass)]">{intent.commerceThemeCode}</span>
              </>
            ) : null}
          </p>
        ) : null}
        {status ? <p className="mt-3 text-xs text-[var(--text-muted)]">{status}</p> : null}
        {bundleJson ? (
          <pre className="mt-4 max-h-64 overflow-auto rounded-md border border-[var(--border-brass)] bg-black/40 p-3 font-mono text-[0.6rem] text-[var(--text-faint)]">
            {bundleJson}
          </pre>
        ) : null}
      </div>
    </section>
  );
}
