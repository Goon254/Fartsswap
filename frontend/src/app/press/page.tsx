import type { Metadata } from 'next';
import { PressKitClient } from '@/components/PressKitClient';

export const metadata: Metadata = {
  title: 'Press · Bureau of Acoustic Gasology',
  description:
    'Official press release, boilerplate quotes, media fact sheet, sample assets, and embargo terms for the public release of Farts.com.',
};

/**
 * `/press` — deadpan press release + embargo kit.
 *
 * Server-side entry. All interactivity (analytics, copy buttons,
 * anchor nav, motion) lives in `PressKitClient`, so this file stays a
 * thin shell. The route is statically prerendered by Next.js.
 */
export default function PressRoute() {
  return <PressKitClient />;
}
