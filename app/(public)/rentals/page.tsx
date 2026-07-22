import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarCheck, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LivePackageShowcase } from '@/components/edrive/live-package-showcase';
import { whatsappUrl } from '@/lib/company-info';

export const metadata: Metadata = {
  title: 'Water Sports Rentals',
  description: 'Explore current eDrive Water Sports jet ski and jet car rental packages in Dubai with clear durations, pricing, and booking support.'
};

export default function Page() {
  return (
    <>
      <section className="border-b border-border bg-white/70 soft-grid">
        <div className="container-x py-10 sm:py-12">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Current Ride Options</p>
          <h1 className="mt-2 max-w-3xl font-heading text-4xl font-semibold leading-tight text-foreground sm:text-5xl">Water Sports Rentals</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">Explore currently available jet ski and jet car packages with clear durations, pricing, guest capacity, and direct booking support from the eDrive team.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild><Link href="/booking"><CalendarCheck data-icon aria-hidden="true" />Book Now</Link></Button>
            <Button asChild variant="gold"><a href={whatsappUrl} target="_blank" rel="noopener noreferrer"><MessageCircle data-icon aria-hidden="true" />WhatsApp Team</a></Button>
          </div>
        </div>
      </section>
      <LivePackageShowcase title="Available Rental Packages" text="Choose a jet ski or jet car experience that matches your preferred duration, group size, and budget." categories={['jet_ski_rental', 'jet_car_rental']} />
    </>
  );
}
