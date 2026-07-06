import type { Metadata } from 'next';
import { LivePackageShowcase } from '@/components/edrive/live-package-showcase';
import { RentalsPage } from '@/components/edrive/public-pages';

export const metadata: Metadata = {
  title: 'Jet Ski & Jet Car Rental Packages in Dubai',
  description: 'Browse eDrive rental packages for jet ski rental Dubai, jet car rental Dubai, combo rides, family water sports, and VIP Dubai marine experiences.'
};

export default function Page() {
  return (
    <>
      <RentalsPage />
      <LivePackageShowcase
        title="Bookable Location Packages"
        text="These active packages are managed from the dashboard and show current B2C prices by location, duration, and capacity."
      />
    </>
  );
}
