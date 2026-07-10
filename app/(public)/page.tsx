import type { Metadata } from 'next';
import { HomePage } from '@/components/edrive/public-pages';

export const metadata: Metadata = {
  title: 'Premium Jet Ski & Jet Car Experiences in Dubai',
  description: 'Premium Dubai water sports website for jet ski and jet car bookings, fleet, membership, and contact at Dubai Islands Marina.'
};

export default function Page() {
  return <HomePage />;
}
