import type { Metadata } from 'next';
import { HomePage } from '@/components/edrive/public-pages';

export const metadata: Metadata = {
  title: 'Premium Jet Ski & Jet Car Experiences in Dubai',
  description: 'Premium Dubai water sports website for jet ski rental Dubai, jet car rental Dubai, fleet, packages, membership, sales, and contact at Dubai Islands Marina.'
};

export default function Page() {
  return <HomePage />;
}
