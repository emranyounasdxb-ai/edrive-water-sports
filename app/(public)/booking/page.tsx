import type { Metadata } from 'next';
import { BookingPage } from '@/components/edrive/public-pages';

export const metadata: Metadata = {
  title: 'Booking Request',
  description: 'Submit a public eDrive Water Sports booking request after choosing a jet ski, jet car, combo, family, or VIP package.'
};

export default function Page() {
  return <BookingPage />;
}
