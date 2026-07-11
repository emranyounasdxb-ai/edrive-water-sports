import type { Metadata } from 'next';
import { BookingPage } from '@/components/edrive/public-pages';

export const metadata: Metadata = {
  title: 'Book Jet Ski & Jet Car Rides Dubai | eDrive Water Sports',
  description: 'Submit a booking request for jet ski rental, jet car rides, combo packages, family rides, and VIP water sports experiences at Dubai Islands.'
};

export default function Page() {
  return <BookingPage />;
}
