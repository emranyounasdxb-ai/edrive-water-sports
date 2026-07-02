import type { Metadata } from 'next';
import { BookingPage } from '@/components/edrive/public-pages';

export const metadata: Metadata = {
  title: 'Booking'
};

export default function Page() {
  return <BookingPage />;
}
