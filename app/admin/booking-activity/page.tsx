import type { Metadata } from 'next';
import { BookingActivityPage } from '@/components/edrive/booking-activity-page';

export const metadata: Metadata = {
  title: 'Booking Activity'
};

export default function Page() {
  return <BookingActivityPage />;
}
