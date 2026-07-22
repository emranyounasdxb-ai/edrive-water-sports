import type { Metadata } from 'next';
import { ContactPage } from '@/components/edrive/public-pages';

export const metadata: Metadata = {
  title: 'Contact Us Dubai',
  description: 'Contact eDrive Water Sports at Dubai Islands for jet ski rentals, jet car rides, memberships, package bookings, and guest support.'
};

export default function Page() {
  return <ContactPage />;
}
