import type { Metadata } from 'next';
import { HomePage } from '@/components/edrive/public-pages';
import '../home-responsive.css';

export const metadata: Metadata = {
  title: {
    absolute: 'Jet Ski Rental Dubai & Jet Car Rides | eDrive Water Sports'
  },
  description: 'Book Jet Ski rentals and Jet Car rides at Dubai Islands with clear packages, flexible times, and easy online booking from eDrive Water Sports.'
};

export default function Page() {
  return <HomePage />;
}
