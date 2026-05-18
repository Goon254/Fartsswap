'use client';

import { useEffect, useRef } from 'react';
import { pageView } from '@/lib/analytics';
import type { EventName, PayloadFor } from '@/lib/analytics-events';

interface AnalyticsPageViewProps<E extends EventName> {
  event: E;
  payload: PayloadFor<E>;
}

/**
 * Fires a single page-view event on mount.
 *
 * Drop one into a server component (like `app/page.tsx`) when the page
 * itself doesn't already have a client subtree that can fire the event in
 * its own `useEffect`. Client orchestrators (AnalyzeFlowClient,
 * ReportResultClient, ShareFlowClient) fire their own views and don't need
 * this wrapper.
 *
 * Uses a ref to guarantee single-fire even under React 18 strict mode
 * double-invocation in dev.
 */
export function AnalyticsPageView<E extends EventName>({
  event,
  payload,
}: AnalyticsPageViewProps<E>) {
  const firedRef = useRef(false);
  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    pageView(event, payload);
    // We intentionally fire on mount only; deps would re-fire on payload
    // identity changes which is the wrong semantics for a page view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
