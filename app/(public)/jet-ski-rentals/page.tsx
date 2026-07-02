import type { Metadata } from 'next';
import { JetSkiRentalsPage } from '@/components/edrive/public-pages';

export const metadata: Metadata = {
  title: 'Jet Ski Rentals'
};

export default function Page() {
  return <JetSkiRentalsPage />;
}
