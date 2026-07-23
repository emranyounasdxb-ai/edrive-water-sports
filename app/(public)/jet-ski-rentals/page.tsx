import type { Metadata } from 'next';
import { CalendarCheck, MessageCircle } from 'lucide-react';
import { LivePackageShowcase } from '@/components/edrive/live-package-showcase';
import { PublicVideoHero } from '@/components/edrive/public-video-hero';
import { whatsappUrl } from '@/lib/company-info';
import { jetSkiLightImage } from '@/lib/mock-data';

export const metadata: Metadata = {
  title: 'Jet Ski Rental Dubai',
  description: 'Book premium jet ski rental in Dubai with eDrive Water Sports at Dubai Islands. Choose your ride duration, seats, price, and preferred time with fast WhatsApp support.'
};

export default function Page() {
  return (
    <>
      <PublicVideoHero
        title="Jet Ski Rental Dubai"
        text="Ride premium Yamaha-style jet skis from Dubai Islands with clear prices, flexible durations, safety briefing, and fast booking support from the eDrive team."
        fallbackImage={jetSkiLightImage}
        fallbackAlt="eDrive jet ski rental in Dubai"
        actions={[
          { href: '/booking', label: 'Book Jet Ski', icon: CalendarCheck },
          { href: whatsappUrl, label: 'WhatsApp Team', icon: MessageCircle, variant: 'gold', external: true }
        ]}
      />
      <LivePackageShowcase title="Jet Ski Rental Packages" text="Choose your jet ski ride by duration, seating capacity, and price. Our team will confirm the best available slot before your experience." categories={['jet_ski_rental']} />
    </>
  );
}
