import type { Metadata } from 'next';
import { FulfillmentLabClient } from '@/components/FulfillmentLabClient';

export const metadata: Metadata = {
  title: 'Fulfillment Lab',
  description: 'Internal POD order inspection — mock provider only.',
  robots: { index: false, follow: false },
};

export default function FulfillmentLabPage() {
  return <FulfillmentLabClient />;
}
