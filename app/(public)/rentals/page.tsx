import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarCheck, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LivePackageShowcase } from '@/components/edrive/live-package-showcase';
import { whatsappUrl } from '@/lib/company-info';

export const metadata: Metadata = {
  title: 'Water Sports Rentals',
  description: 'Live eDrive Water Sports rental packages from the admin package dashboard.'
};

export default function Page() {
  return (
    <>
      <section className="border-b border-border bg-white/70 soft-grid">
        <div className="container-x py-10 sm:py-12">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Live Packages</p>
          <h1 className="mt-2 max-w-3xl font-heading text-4xl font-semibold leading-tight text-foreground sm:text-5xl">Water Sports Rentals</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">Only active packages from the admin package dashboard are shown here. Add or update packages in the backend and they will update on the website.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild><Link href="/booking"><CalendarCheck data-icon aria-hidden="true" />Book Now</Link></Button>
            <Button asChild variant="gold"><a href={whatsappUrl} target="_blank" rel="noopener noreferrer"><MessageCircle data-icon aria-hidden="true" />WhatsApp Team</a></Button>
          </div>
        </div>
      </section>
      <LivePackageShowcase title="Live Rental Packages" text="Jet ski and jet car packages are loaded from Supabase packages." categories={['jet_ski_rental', 'jet_car_rental']} />
    </>
  );
}
