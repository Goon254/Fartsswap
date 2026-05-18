import type { PremiumIntent } from './artifact-commerce-types';

export interface PremiumArtifactThemeDto {
  code: string;
  displayName: string;
  description: string;
  pdfThemeCode: string;
  suggestedReportVariantIds: readonly string[];
  priceCents: number;
  currency: 'USD';
  available: boolean;
  productSkus: {
    themeUpgrade: string;
    officialPdf: string;
    wallPrint: string;
    merchBundle: string;
  };
}

export async function fetchCommerceThemes(): Promise<readonly PremiumArtifactThemeDto[] | null> {
  const res = await fetch('/api/commerce/artifacts/themes', { cache: 'no-store', credentials: 'same-origin' });
  if (!res.ok) return null;
  try {
    const data = (await res.json()) as { themes?: PremiumArtifactThemeDto[] };
    return data.themes ?? null;
  } catch {
    return null;
  }
}

export async function createCommerceIntent(body: {
  reportId: string;
  sourceSurface?: string;
  variantId?: string;
}): Promise<PremiumIntent | null> {
  const res = await fetch('/api/commerce/artifacts/intents', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  try {
    return (await res.json()) as PremiumIntent;
  } catch {
    return null;
  }
}

export async function transitionCommerceIntent(
  intentId: string,
  body: { targetState: string; commerceThemeCode?: string; productSku?: string; amountCents?: number },
): Promise<PremiumIntent | null> {
  const res = await fetch(`/api/commerce/artifacts/intents/${encodeURIComponent(intentId)}/transition`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  try {
    return (await res.json()) as PremiumIntent;
  } catch {
    return null;
  }
}

export async function prepareCommerceCheckout(intentId: string): Promise<unknown | null> {
  const res = await fetch(`/api/commerce/artifacts/intents/${encodeURIComponent(intentId)}/checkout-prep`, {
    method: 'POST',
    credentials: 'same-origin',
  });
  if (!res.ok) return null;
  try {
    return (await res.json()) as unknown;
  } catch {
    return null;
  }
}

export async function completeCommerceCheckoutStub(intentId: string): Promise<PremiumIntent | null> {
  const res = await fetch(
    `/api/commerce/artifacts/intents/${encodeURIComponent(intentId)}/checkout-complete-stub`,
    { method: 'POST', credentials: 'same-origin' },
  );
  if (!res.ok) return null;
  try {
    return (await res.json()) as PremiumIntent;
  } catch {
    return null;
  }
}

export async function fetchMerchBundle(intentId: string): Promise<unknown | null> {
  const res = await fetch(`/api/commerce/artifacts/intents/${encodeURIComponent(intentId)}/merch-bundle`, {
    cache: 'no-store',
    credentials: 'same-origin',
  });
  if (!res.ok) return null;
  try {
    return (await res.json()) as unknown;
  } catch {
    return null;
  }
}

export async function previewCertificate(
  intentId: string,
  certificateKind: 'official_pdf' | 'wall_print',
): Promise<{ artifactId: string; contentUrl: string } | null> {
  const res = await fetch(`/api/commerce/artifacts/intents/${encodeURIComponent(intentId)}/certificate-preview`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: {
      'content-type': 'application/json',
      'idempotency-key': crypto.randomUUID(),
    },
    body: JSON.stringify({ certificateKind }),
  });
  if (!res.ok) return null;
  try {
    return (await res.json()) as { artifactId: string; contentUrl: string };
  } catch {
    return null;
  }
}
