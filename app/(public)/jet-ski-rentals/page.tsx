import type { Metadata } from 'next';
import { LivePackageShowcase } from '@/components/edrive/live-package-showcase';
import { PublicHero } from '@/components/edrive/public-pages';
import { CalendarCheck, MessageCircle } from 'lucide-react';
import { jetSkiLightImage } from '@/lib/mock-data';
import { whatsappUrl } from '@/lib/company-info';

export const metadata: Metadata = {
  title: 'Jet Ski Rentals',
  description: 'Live eDrive Water Sports jet ski rental packages from the admin package dashboard.'
};

export default function Page() {
  return (
    <>
      <PublicHero
        title="Jet Ski Rentals Dubai"
        text="Choose from active jet ski rental packages managed in the eDrive package dashboard. Prices and durations update live from the backend."
        image={jetSkiLightImage}
        imageAlt="eDrive jet ski rental in Dubai"
        actions={[
          { href: '/booking', label: 'Book Jet Ski', icon: CalendarCheck },
          { href: whatsappUrl, label: 'WhatsApp Team', icon: MessageCircle, variant: 'gold', external: true }
        ]}
      />
      <LivePackageShowcase title="Live Jet Ski Packages" text="Only active jet ski packages from the backend are shown here." categories={['jet_ski_rental']} />
    </>
  );
}
