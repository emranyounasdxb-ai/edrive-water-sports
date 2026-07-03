import type { Metadata } from 'next';
import { LegacyRoutePage } from '@/components/edrive/public-pages';

export const metadata: Metadata = {
  title: 'Jet Ski Rentals',
  robots: { index: false, follow: true }
};

export default function Page() {
  return (
    <LegacyRoutePage
      title="Jet Ski Packages Have Moved"
      text="Jet ski rental Dubai packages are now grouped inside the main Rentals page with package cards, duration details, and booking CTAs."
      href="/rentals#jet-ski-packages"
      cta="View Jet Ski Packages"
    />
  );
}
