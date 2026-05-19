import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter, JetBrains_Mono } from 'next/font/google';
import { AnalyticsDebugPanel } from '@/components/dev/AnalyticsDebugPanel';
import { ThemeBootstrap } from '@/components/ThemeToggle';
import './globals.css';

/**
 * Fonts:
 *   - Fraunces       — editorial display serif with optical-size axis. Used
 *                      for hero headline, section titles, lore terms.
 *   - Inter          — modern sans for body + UI.
 *   - JetBrains Mono — institutional monospace for labels, codes, hashes.
 *
 * All self-hosted via next/font/google so we ship zero CDN dependencies.
 */

const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  // 'variable' enables the full weight range (Fraunces ships with one) plus
  // the optical-size axis we want for the editorial headlines.
  weight: 'variable',
  style: ['normal', 'italic'],
  axes: ['opsz'],
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  weight: ['400', '500', '600'],
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://fartsswap.com'),
  title: {
    default: 'Fartsswap.com — Bureau of Acoustic Gasology',
    template: '%s · Fartsswap.com',
  },
  description:
    'The world\u2019s first AI-powered fart diagnostic lab. Record a fart. Receive a clinically unnecessary report. Share responsibly.',
  applicationName: 'Fartsswap.com',
  authors: [{ name: 'Bureau of Acoustic Gasology' }],
  keywords: [
    'fart report',
    'AI parody',
    'acoustic diagnostics',
    'share card',
    'fake diagnostic',
  ],
  openGraph: {
    title: 'Fartsswap.com — Bureau of Acoustic Gasology',
    description:
      'Record a fart. Receive a clinically unnecessary report. Share responsibly.',
    siteName: 'Fartsswap.com',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fartsswap.com — Bureau of Acoustic Gasology',
    description:
      'Record a fart. Receive a clinically unnecessary report. Share responsibly.',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#050807' },
    { media: '(prefers-color-scheme: light)', color: '#fbf7ed' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable} ${mono.variable}`}>
      <head>
        <ThemeBootstrap />
      </head>
      <body className="min-h-dvh antialiased">
        {children}
        {/* Dev-only floating event tape. Tree-shaken in production. */}
        <AnalyticsDebugPanel />
      </body>
    </html>
  );
}
