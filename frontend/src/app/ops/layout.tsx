import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mission Control',
  description: 'Internal Bureau launch analytics — not indexed.',
  robots: { index: false, follow: false },
};

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-[var(--bg-base)] text-[var(--text-default)]">{children}</div>;
}
