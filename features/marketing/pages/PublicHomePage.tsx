import Link from 'next/link';
import { ChevronRight, ShipWheel, Waves, Gauge, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { JsonLd } from '@/components/seo/JsonLd';
import { siteConfig } from '@/config/site';
import { PublicHeader } from '@/features/marketing/components/PublicHeader';

const highlights = [
  { icon: Waves, title: 'Oceanfront experiences', text: 'Curated jet ski and jet car rides across premium Dubai waterfront routes.' },
  { icon: Gauge, title: 'Controlled availability', text: 'Booking slots are protected by real-time inventory and database rules.' },
  { icon: ShieldCheck, title: 'Safety-led service', text: 'Premium fleet operations with trained staff and controlled handover process.' },
];

export function PublicHomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-ocean-radial">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          name: siteConfig.name,
          description: siteConfig.description,
          address: { '@type': 'PostalAddress', addressLocality: 'Dubai', addressCountry: 'AE' },
          telephone: siteConfig.phone,
          url: siteConfig.url,
          areaServed: 'Dubai',
          priceRange: '$$$',
        }}
      />
      <PublicHeader />
      <section className="relative pt-32 md:pt-40">
        <div className="absolute inset-0 -z-10 opacity-40">
          <div className="absolute left-1/2 top-10 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute right-0 top-48 h-80 w-80 rounded-full bg-sand/10 blur-3xl" />
        </div>
        <div className="luxury-container grid gap-10 pb-20 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-white/12 bg-white/8 px-4 py-2 text-xs uppercase tracking-[0.24em] text-primary">
              Luxury Water Sports Dubai
            </div>
            <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.06em] text-white md:text-7xl">
              Premium Jet Ski & Jet Car Experiences
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/68">
              Book high-end water sports experiences with controlled fleet availability, smooth booking flow, and concierge-style customer handling.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/booking">Start Booking <ChevronRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/jet-car-rentals">Explore Fleet</Link>
              </Button>
            </div>
          </div>
          <Card className="relative min-h-[420px] overflow-hidden p-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,212,234,0.26),transparent_34%),linear-gradient(145deg,rgba(255,255,255,0.14),rgba(255,255,255,0.02))]" />
            <div className="relative flex h-full flex-col justify-between p-8">
              <ShipWheel className="h-14 w-14 text-primary" />
              <div>
                <div className="mb-4 text-sm uppercase tracking-[0.24em] text-sand">Today’s Experience</div>
                <h2 className="text-3xl font-semibold text-white">Dubai Marina Luxury Ride</h2>
                <p className="mt-3 text-white/64">Availability, pricing, coupon checks, and booking creation are handled through Supabase.</p>
              </div>
            </div>
          </Card>
        </div>
      </section>
      <section className="luxury-container grid gap-5 pb-24 md:grid-cols-3">
        {highlights.map((item) => (
          <Card key={item.title}>
            <item.icon className="h-9 w-9 text-primary" />
            <CardTitle className="mt-6">{item.title}</CardTitle>
            <CardDescription>{item.text}</CardDescription>
          </Card>
        ))}
      </section>
    </main>
  );
}
