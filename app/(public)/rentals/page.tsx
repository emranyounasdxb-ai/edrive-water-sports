import type { Metadata } from 'next';
import { RentalsPage } from '@/components/edrive/public-pages';

export const metadata: Metadata = {
  title: 'Jet Ski & Jet Car Rental Packages in Dubai',
  description: 'Browse 50 static eDrive rental packages for jet ski rental Dubai, jet car rental Dubai, combo rides, family water sports, and VIP Dubai marine experiences.'
};

export default function Page() {
  return <RentalsPage />;
}
