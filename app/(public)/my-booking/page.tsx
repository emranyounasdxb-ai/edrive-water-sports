import type { Metadata } from 'next';
import { PublicBookingTracker } from '@/components/edrive/public-booking-tracker';

export const metadata: Metadata = {
  title: 'Track My Booking',
  description: 'Track your eDrive Water Sports booking request using your booking code and contact details, then view its current status and submitted ride details.',
  alternates: {
    canonical: '/my-booking/'
  },
  openGraph: {
    title: 'Track My Booking | eDrive Water Sports',
    description: 'Track your eDrive Water Sports booking request using your booking code and contact details, then view its current status and submitted ride details.',
    url: '/my-booking/',
    type: 'website'
  }
};

export default function Page() {
  return <PublicBookingTracker />;
}
