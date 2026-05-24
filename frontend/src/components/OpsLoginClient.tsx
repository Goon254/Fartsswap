'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, type FormEvent } from 'react';
import { BackgroundLayers } from '@/components/BackgroundLayers';
import { Button } from '@/components/Button';
import { Navbar } from '@/components/Navbar';

export function OpsLoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawReturn = searchParams.get('returnTo');
  const returnTo =
    rawReturn && rawReturn.startsWith('/') && !rawReturn.startsWith('//') && !rawReturn.startsWith('/ops/login')
      ? rawReturn
      : '/moderation-lab';
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setBusy(true);
      setError(null);
      try {
        const res = await fetch('/api/ops/auth', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ password }),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          setError(data.error ?? 'Sign-in failed');
          return;
        }
        router.replace(returnTo.startsWith('/') ? returnTo : '/moderation-lab');
        router.refresh();
      } catch {
        setError('Could not reach the server');
      } finally {
        setBusy(false);
      }
    },
    [password, returnTo, router],
  );

  return (
    <>
      <BackgroundLayers />
      <div className="relative z-10 flex min-h-dvh flex-col">
        <Navbar />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-16">
          <p className="font-mono text-[0.65rem] uppercase tracking-wide-3 text-[var(--accent-brass)]">
            STAFF ONLY
          </p>
          <h1 className="mt-2 font-display text-3xl text-[var(--text-strong)]">Sign in</h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">
            Moderation and internal tools require the staff password. This is not a public account — use the
            password your team set in server config.
          </p>

          <form onSubmit={(e) => void onSubmit(e)} className="mt-8 space-y-4">
            <label className="block font-mono text-[0.6rem] uppercase tracking-wide-3 text-[var(--text-faint)]">
              Staff password
              <input
                type="password"
                autoComplete="current-password"
                required
                className="mt-1 w-full rounded-md border border-[var(--border-stark)] bg-black/30 px-3 py-2 font-sans text-sm text-[var(--text-primary)]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {error ? (
              <p className="font-mono text-xs text-[var(--accent-warning)]" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" disabled={busy}>
              {busy ? 'Signing in…' : 'Continue'}
            </Button>
          </form>
        </main>
      </div>
    </>
  );
}
