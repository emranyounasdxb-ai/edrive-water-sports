import type { Metadata } from 'next';
import { CalendarCheck, MessageCircle } from 'lucide-react';
import { LivePackageShowcase } from '@/components/edrive/live-package-showcase';
import { PublicVideoHero } from '@/components/edrive/public-video-hero';
import { whatsappUrl } from '@/lib/company-info';
import { jetCarLightImage } from '@/lib/mock-data';

export const metadata: Metadata = {
  title: 'Jet Car Rental Dubai',
  description: 'Book a luxury jet car rental in Dubai with eDrive Water Sports at Dubai Islands. Compare ride durations, prices, seating options, and premium water sports experiences.'
};

export default function Page() {
  return (
    <>
      <PublicVideoHero
        title="Jet Car Rental Dubai"
        text="Enjoy a premium jet car ride in Dubai with luxury photo moments, comfortable seating, clear package options, and support from the eDrive Water Sports team."
        fallbackImage={jetCarLightImage}
        fallbackAlt="eDrive jet car rental in Dubai"
        actions={[
          { href: '/booking', label: 'Book Jet Car', icon: CalendarCheck },
          { href: whatsappUrl, label: 'WhatsApp Team', icon: MessageCircle, variant: 'gold', external: true }
        ]}
      />
      <LivePackageShowcase title="Jet Car Rental Packages" text="Choose a jet car ride by duration, seating capacity, and price. Perfect for couples, families, birthdays, photos, and premium Dubai water experiences." categories={['jet_car_rental']} />
    </>
  );
}
