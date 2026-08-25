import type { Metadata } from 'next';
import { CalendarCheck, MessageCircle } from 'lucide-react';
import { LivePackageShowcase } from '@/components/edrive/live-package-showcase';
import { PublicVideoHero } from '@/components/edrive/public-video-hero';
import { whatsappUrl } from '@/lib/company-info';
import { fleetHeroImage } from '@/lib/mock-data';
import { createPublicMetadata } from '@/lib/i18n/metadata';

export const metadata: Metadata = createPublicMetadata('en', 'rentals');

export default function Page() {
  return (
    <>
      <PublicVideoHero
        title="Water Sports Rentals"
        text="Explore currently available jet ski and jet car packages with clear durations, pricing, guest capacity, and direct booking support from the eDrive team."
        fallbackImage={fleetHeroImage}
        fallbackAlt="eDrive Water Sports rentals in Dubai"
        actions={[
          { href: '/booking', label: 'Book Now', icon: CalendarCheck },
          { href: whatsappUrl, label: 'WhatsApp Team', icon: MessageCircle, variant: 'gold', external: true }
        ]}
      />
      <LivePackageShowcase title="Available Rental Packages" text="Choose a jet ski or jet car experience that matches your preferred duration, group size, and budget." categories={['jet_ski_rental', 'jet_car_rental']} />
    </>
  );
}
