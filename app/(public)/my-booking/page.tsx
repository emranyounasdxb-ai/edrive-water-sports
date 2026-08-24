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
    siteName: 'eDrive Water Sports',
    images: [{
      url: '/brand/og-image.png',
      width: 1200,
      height: 630,
      alt: 'Track an eDrive Water Sports booking request'
    }],
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Track My Booking | eDrive Water Sports',
    description: 'Track your eDrive Water Sports booking request using your booking code and contact details, then view its current status and submitted ride details.',
    images: ['/brand/og-image.png']
  }
};

export default function Page() {
  return <PublicBookingTracker />;
}
