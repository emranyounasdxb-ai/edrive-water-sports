import Image from 'next/image';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, CalendarCheck, MapPin, MessageCircle, Phone, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { companyInfo, whatsappUrl } from '@/lib/company-info';
import { cn } from '@/lib/utils';
import { HomeHeroCarousel } from './home-hero-carousel';

const sectionPad = 'py-10 sm:py-12 lg:py-14';

const whyChoose = [
  { icon: MapPin, title: 'Dubai Islands Location', text: `Start your ride from ${companyInfo.locationName} with clear arrival guidance and team support.` },
  { icon: ShieldCheck, title: 'Safety First', text: 'Every experience includes a safety briefing, life jacket support, and guidance from the eDrive team.' },
  { icon: MessageCircle, title: 'Fast WhatsApp Support', text: 'Get quick help with availability, timing, ride options, and special requests before you arrive.' },
  { icon: CalendarCheck, title: 'Easy Booking', text: 'Choose your ride, duration, date, time, and guest count, then submit your request in minutes.' }
];

const bookingSteps = [
  { icon: Sparkles, title: 'Choose your ride', text: 'Select a jet ski, jet car, or package that matches your group and preferred timing.' },
  { icon: CalendarCheck, title: 'Pick date and time', text: 'Share your preferred slot, guest count, and any celebration or group details.' },
  { icon: MessageCircle, title: 'Team confirms', text: 'Our team checks availability and confirms the final details before your water sports experience.' }
];

export function HomePage() {
  return (
    <>
      <HomeHeroCarousel />

      <section className="bg-[#f4f5f5]" data-home-rides>
        <div className={cn('container-x', sectionPad)}>
          <SectionHeader title="Choose Your Water Experience" text="Start with a Jet Ski or Jet Car experience, then compare the available ride durations and prices." />
          <div className="mt-7 grid gap-5 md:grid-cols-2">
            <HomeRideCard
              title="Book Jet Ski Ride"
              text="Choose a premium Jet Ski experience, then compare available ride durations and seating options."
              image="/images/edrive/home/home-jet-ski-rentals.webp"
              mobileImage="/images/edrive/home/home-jet-ski-rentals-768.webp"
              href="/jet-ski-rentals"
              cta="View Jet Ski Packages"
              data-home-ride-card
            />
            <HomeRideCard
              title="Book Jet Car Ride"
              text="Discover a luxury Jet Car experience for couples, families, celebrations, and memorable Dubai moments."
              image="/images/edrive/home/home-jet-car-rentals.webp"
              mobileImage="/images/edrive/home/home-jet-car-rentals-768.webp"
              href="/jet-car-rentals"
              cta="View Jet Car Packages"
              data-home-ride-card
            />
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-white/70" data-home-membership>
        <div className={cn('container-x', sectionPad)}>
          <div className="grid overflow-hidden rounded-[1.6rem] bg-primary-900 text-white shadow-xl md:grid-cols-2 md:items-stretch">
            <picture className="block h-full">
              <source media="(max-width: 767px)" srcSet="/images/edrive/home/home-membership-gold-card-768.webp" />
              <Image src="/images/edrive/home/home-membership-gold-card.webp" alt="eDrive Membership card" width={1200} height={800} className="h-full min-h-64 w-full object-cover" />
            </picture>
            <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent-300">eDrive Membership</p>
              <h2 className="mt-3 font-heading text-3xl font-semibold leading-tight sm:text-4xl">Make Every Ride More Rewarding</h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/80 sm:text-base">Discover priority benefits, exclusive offers, and dedicated support designed for returning eDrive guests.</p>
              <Button asChild className="mt-6 w-fit rounded-full bg-accent-500 text-primary-900 hover:bg-accent-100"><Link href="/membership">Explore Membership<ArrowRight data-icon aria-hidden="true" /></Link></Button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white/70" data-home-why>
        <div className={cn('container-x', sectionPad)}>
          <SectionHeader title="Why Choose eDrive" text="A premium Dubai water sports experience built around clear packages, safety support, smooth booking, and guest-focused service." />
          <FeatureGrid items={whyChoose} className="mt-7 lg:grid-cols-4" />
        </div>
      </section>

      <section className="bg-[#f4f5f5]" data-home-process>
        <div className={cn('container-x grid gap-7 lg:grid-cols-[0.78fr_1.22fr] lg:items-center', sectionPad)}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">How it works</p>
            <h2 className="mt-3 section-title">From package choice to confirmed water time</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">Choose your ride, share your preferred timing, and our team will confirm availability before you arrive.</p>
          </div>
          <FeatureGrid items={bookingSteps} className="lg:grid-cols-3" />
        </div>
      </section>

      <HomeContactStrip />
    </>
  );
}

function SectionHeader({ title, text }: { title: string; text: string }) {
  return <div><h2 className="section-title">{title}</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">{text}</p></div>;
}

function HomeRideCard({ title, text, image, mobileImage, href, cta, ...marker }: { title: string; text: string; image: string; mobileImage: string; href: string; cta: string; 'data-home-ride-card': true }) {
  return (
    <Link href={href} className="premium-card-hover group flex h-full flex-col overflow-hidden rounded-[1.5rem] bg-white shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4" {...marker}>
      <div className="overflow-hidden">
        <picture className="block">
          <source media="(max-width: 767px)" srcSet={mobileImage} />
          <Image src={image} alt={title} width={1200} height={750} className="aspect-[16/9] w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
        </picture>
      </div>
      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <h3 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">{title}</h3>
        <p className="mt-3 flex-1 text-sm leading-7 text-muted-foreground sm:text-base">{text}</p>
        <span className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-primary-900 px-5 py-2.5 text-sm font-semibold text-white transition group-hover:bg-primary-700 group-focus-visible:bg-primary-700">{cta}<ArrowRight data-icon aria-hidden="true" /></span>
      </div>
    </Link>
  );
}

function FeatureGrid({ items, className }: { items: { icon: LucideIcon; title: string; text: string }[]; className?: string }) {
  return <div className={cn('grid gap-4 md:grid-cols-2', className)}>{items.map((item) => <FeatureCard key={item.title} item={item} />)}</div>;
}

function FeatureCard({ item }: { item: { icon: LucideIcon; title: string; text: string } }) {
  const Icon = item.icon;
  return <Card className="premium-card-hover"><CardContent className="p-5"><span className="mb-4 flex size-10 items-center justify-center rounded-md bg-primary-50 text-primary"><Icon data-icon aria-hidden="true" /></span><h3 className="font-semibold text-foreground">{item.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p></CardContent></Card>;
}

function HomeContactStrip() {
  return (
    <section className="bg-[#f4f5f5] pb-10 sm:pb-12 lg:pb-14" data-home-contact>
      <div className="container-x">
        <div className="flex flex-col gap-4 rounded-[1.5rem] bg-primary-900 p-5 text-white shadow-xl lg:flex-row lg:items-center lg:justify-between">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent-300">Need help choosing?</p><h2 className="mt-2 font-heading text-2xl font-semibold">Talk to eDrive before you book.</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">Tell us your date, number of guests, preferred ride, or whether you need help with an eDrive Signature Membership inquiry.</p></div>
          <div className="flex flex-col gap-2 sm:flex-row"><Button asChild className="rounded-full bg-emerald-500 hover:bg-emerald-600"><a href={whatsappUrl} target="_blank" rel="noopener noreferrer"><MessageCircle data-icon aria-hidden="true" />Chat on WhatsApp</a></Button><Button asChild variant="outline" className="rounded-full bg-white text-primary-900 hover:bg-primary-50"><a href={`tel:${companyInfo.landlineHref}`}><Phone data-icon aria-hidden="true" />Call Now</a></Button></div>
        </div>
      </div>
    </section>
  );
}
