import type { Metadata } from 'next';
import { LaunchShellClient } from '@/components/LaunchShellClient';

export const metadata: Metadata = {
  title: 'Bureau of Acoustic Gasology · Opening to the Public',
  description:
    'Pre-release bulletin. The world\u2019s first AI-powered fart diagnostic lab is preparing public filing. Founding designations accepted.',
};

/**
 * `/launch` always renders the pre-launch shell, regardless of the
 * `LAUNCH_MODE` flag. Use this route to preview launch packaging after
 * the homepage has been flipped to live mode.
 */
export default function LaunchRoute() {
  return <LaunchShellClient surface="launch" />;
}
