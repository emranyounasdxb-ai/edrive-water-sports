import type { Metadata } from 'next';
import { PublicBookingTracker } from '@/components/edrive/public-booking-tracker';
import { createPublicMetadata } from '@/lib/i18n/metadata';

export const metadata: Metadata = createPublicMetadata('en', 'myBooking');

export default function Page() {
  return <PublicBookingTracker />;
}
