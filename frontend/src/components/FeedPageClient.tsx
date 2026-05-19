'use client';

import { useEffect, useState, type FC } from 'react';
import Link from 'next/link';
import { BackgroundLayers } from '@/components/BackgroundLayers';
import { FeedCard } from '@/components/FeedCard';
import { FooterLoreStrip } from '@/components/FooterLoreStrip';
import { Navbar } from '@/components/Navbar';
import { fetchPublicFeed } from '@/lib/gallery-api';
import { pageView } from '@/lib/analytics';
import type { GalleryPublicFeedItem } from '@/lib/farts-api-types';

const FeedEmptyState: FC<{
  title: string;
  body: string;
  actionHref?: string;
  actionLabel?: string;
}> = ({ title, body, actionHref, actionLabel }) => (
  <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-panel)] px-5 py-6">
    <h2 className="font-display text-lg text-[var(--text-primary)]">{title}</h2>
    <p className="mt-2 font-mono text-[0.7rem] leading-relaxed text-[var(--text-muted)]">{body}</p>
    {actionHref && actionLabel ? (
      <Link
        href={actionHref}
        className="mt-4 inline-block font-mono text-[0.65rem] uppercase tracking-wide-2 text-[var(--accent-brass)] underline-offset-2 hover:underline"
      >
        {actionLabel}
      </Link>
    ) : null}
  </div>
);


export const FeedPageClient: FC = () => {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [items, setItems] = useState<GalleryPublicFeedItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    pageView('feed_view', {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const feed = await fetchPublicFeed(32);
        if (!cancelled) {
          setEnabled(feed.enabled);
          setItems(feed.items);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setEnabled(false);
          setItems([]);
          setError(e instanceof Error ? e.message : 'Failed to load feed');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loading = enabled === null && !error;

  return (
    <>
      <BackgroundLayers />
      <div className="relative z-10 flex min-h-dvh flex-col">
        <Navbar />
        <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10 lg:px-10">
          <header className="mb-8">
            <p className="font-mono text-[0.65rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
              PUBLIC · MODERATED FEED
            </p>
            <h1 className="mt-2 font-display text-3xl text-[var(--text-strong)]">Specimen bulletin</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--text-muted)]">
              Opt-in only — nothing posts publicly until moderators approve and publish it. Anonymous
              labels, no accounts, no comments. See something off? Use{' '}
              <span className="text-[var(--text-default)]">Report specimen</span> on any card.
            </p>
          </header>

          {loading ? (
            <p className="font-mono text-[0.7rem] text-[var(--text-faint)]">Loading feed…</p>
          ) : null}

          {error ? (
            <FeedEmptyState
              title="Feed unavailable"
              body={error}
              actionHref="/"
              actionLabel="Back to home"
            />
          ) : null}

          {!loading && !error && enabled === false ? (
            <FeedEmptyState
              title="Public feed is offline"
              body="The bulletin is disabled on this deployment. Record a specimen and opt in from your dossier when the desk reopens."
              actionHref="/analyze?path=record"
              actionLabel="Record my fart"
            />
          ) : null}

          {!loading && !error && enabled === true && items.length === 0 ? (
            <FeedEmptyState
              title="No published specimens yet"
              body="Nothing approved for the bulletin. Record a real fart, open your dossier, and choose Post to public feed — moderation comes first."
              actionHref="/analyze?path=record"
              actionLabel="Record my fart"
            />
          ) : null}

          {!loading && !error && enabled === true && items.length > 0 ? (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {items.map((item) => (
                <li key={item.submissionId}>
                  <FeedCard item={item} />
                </li>
              ))}
            </ul>
          ) : null}
        </main>
        <FooterLoreStrip />
      </div>
    </>
  );
};
