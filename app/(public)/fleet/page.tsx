import type { Metadata } from 'next';
import { LivePackageShowcase } from '@/components/edrive/live-package-showcase';
import { FleetPage } from '@/components/edrive/public-pages';

export const metadata: Metadata = {
  title: 'Jet Ski & Jet Car Fleet Dubai',
  description: 'Explore eDrive Water Sports premium jet ski and jet car fleet at Dubai Islands with ride options for tourists, residents, families, couples, and VIP guests.'
};

export default function Page() {
  return (
    <>
      <FleetPage />
      <LivePackageShowcase title="Fleet Ride Packages" text="Compare premium jet ski and jet car ride options with clear durations, seating capacity, and Dubai Islands booking support." />
    </>
  );
}
