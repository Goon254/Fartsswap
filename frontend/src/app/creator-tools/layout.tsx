import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community Lab · Creator Tools',
  description: 'Internal Bureau surface for Discord-style community tooling previews. Not indexed.',
  robots: { index: false, follow: false },
};

export default function CreatorToolsLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-dvh bg-[var(--bg-base)] text-[var(--text-default)]">{children}</div>;
}
