import type { Metadata } from 'next';
import { JetCarRentalsPage } from '@/components/edrive/public-pages';

export const metadata: Metadata = {
  title: 'Jet Car Rentals'
};

export default function Page() {
  return <JetCarRentalsPage />;
}
