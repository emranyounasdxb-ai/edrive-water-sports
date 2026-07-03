import type { Metadata } from 'next';
import { LegacyRoutePage } from '@/components/edrive/public-pages';

export const metadata: Metadata = {
  title: 'Jet Car Rentals',
  robots: { index: false, follow: true }
};

export default function Page() {
  return (
    <LegacyRoutePage
      title="Jet Car Packages Have Moved"
      text="Jet car rental Dubai packages are now part of the main Rentals page, with luxury jet car cards and package-led booking links."
      href="/rentals#jet-car-packages"
      cta="View Jet Car Packages"
    />
  );
}
