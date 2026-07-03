import type { Metadata } from 'next';
import { ContactPage } from '@/components/edrive/public-pages';

export const metadata: Metadata = {
  title: 'Contact eDrive Water Sports Dubai',
  description: 'Contact eDrive Water Sports at Dubai Islands Marina for jet ski rental Dubai, jet car rental Dubai, membership, sales, and package booking inquiries.'
};

export default function Page() {
  return <ContactPage />;
}
