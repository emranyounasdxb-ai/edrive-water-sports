import type { Metadata } from 'next';
import { PublicBookingTracker } from '@/components/edrive/public-booking-tracker';

export const metadata: Metadata = {
  title: 'Check Booking Status',
  description: 'Securely check your eDrive Water Sports booking status using your booking code and contact details.',
  alternates: {
    canonical: '/my-booking/'
  },
  robots: {
    index: false,
    follow: true
  }
};

export default function Page() {
  return <PublicBookingTracker />;
}
