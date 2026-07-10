import type { Metadata } from 'next';
import { LivePackageShowcase } from '@/components/edrive/live-package-showcase';
import { FleetPage } from '@/components/edrive/public-pages';

export const metadata: Metadata = {
  title: 'Premium Water Sports Fleet',
  description: 'Explore eDrive Water Sports jet ski and jet car fleet options for Dubai Islands water sports, guided rides, VIP experiences, and family-friendly packages.'
};

export default function Page() {
  return (
    <>
      <FleetPage />
      <LivePackageShowcase title="Live Fleet Packages" text="Only active packages from the admin package dashboard are shown here. New package updates appear live on the website." />
    </>
  );
}
