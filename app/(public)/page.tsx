import type { Metadata } from 'next';
import { HomePage } from '@/components/edrive/public-pages';

export const metadata: Metadata = {
  title: {
    absolute: 'Jet Ski Rental Dubai & Jet Car Rides | eDrive Water Sports'
  },
  description: 'Book premium jet ski rental, jet car rides, and Dubai water sports experiences with eDrive Water Sports at Dubai Islands. Clear packages, fast support, and memorable marine experiences.'
};

export default function Page() {
  return <HomePage />;
}
