import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { CalendarCheck, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LivePackageShowcase } from '@/components/edrive/live-package-showcase';
import { jetCarLightImage } from '@/lib/mock-data';
import { whatsappUrl } from '@/lib/company-info';

export const metadata: Metadata = {
  title: 'Jet Car Rentals',
  description: 'Live eDrive Water Sports jet car rental packages from the admin package dashboard.'
};

export default function Page() {
  return (
    <>
      <section className="border-b border-border bg-white/70 soft-grid">
        <div className="container-x grid gap-7 py-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
          <div className="max-w-2xl">
            <h1 className="font-heading text-3xl font-semibold leading-tight text-foreground sm:text-4xl lg:text-5xl">Jet Car Rentals Dubai</h1>
            <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">Choose from active jet car rental packages managed in the eDrive package dashboard. Prices and durations update live from the backend.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild><Link href="/booking"><CalendarCheck data-icon aria-hidden="true" />Book Jet Car</Link></Button>
              <Button asChild variant="gold"><a href={whatsappUrl} target="_blank" rel="noopener noreferrer"><MessageCircle data-icon aria-hidden="true" />WhatsApp Team</a></Button>
            </div>
          </div>
          <div className="relative min-h-[280px] overflow-hidden rounded-[2rem] border border-white/70 shadow-glass lg:min-h-[360px]">
            <Image src={jetCarLightImage} alt="eDrive jet car rental in Dubai" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 52vw" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(4,23,33,0.28))]" />
          </div>
        </div>
      </section>
      <LivePackageShowcase title="Live Jet Car Packages" text="Only active jet car packages from the backend are shown here." categories={['jet_car_rental']} />
    </>
  );
}
