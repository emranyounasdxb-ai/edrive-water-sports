import Image from 'next/image';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  CalendarCheck,
  Car,
  CheckCircle2,
  Crown,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Waves
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { companyInfo, whatsappUrl } from '@/lib/company-info';
import { dubaiWaterfrontImage, fleetHeroImage, fleetShowcaseImage, jetCarLightImage, jetSkiLightImage } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { BookingForm } from './booking-form';
import { ContactForm } from './contact-form';
import { HeroVideoMedia } from './hero-video-media';
import { LivePackageShowcase } from './live-package-showcase';
import { MotionReveal } from './motion-reveal';
import { PublicVideoHero, publicHeroContentClass, publicHeroFrameClass, type PublicHeroAction } from './public-video-hero';

const sectionPad = 'py-10 sm:py-12 lg:py-14';

type HeroAction = PublicHeroAction;

const serviceCards = [
  {
    icon: Waves,
    title: 'Jet Ski Rentals',
    text: 'Premium jet ski rental in Dubai with clear duration options, safety briefing, and fast booking support from Dubai Islands.',
    image: jetSkiLightImage,
    href: '/jet-ski-rentals',
    cta: 'View Jet Ski Packages'
  },
  {
    icon: Car,
    title: 'Jet Car Rentals',
    text: 'Luxury jet car rides for couples, families, birthdays, photos, and unforgettable Dubai water sports moments.',
    image: jetCarLightImage,
    href: '/jet-car-rentals',
    cta: 'View Jet Car Packages'
  },
  {
    icon: Crown,
    title: 'VIP Marine Support',
    text: 'Personal ride planning, priority support, and elevated service for groups, special occasions, and VIP guests.',
    image: fleetShowcaseImage,
    href: '/membership',
    cta: 'Request VIP Support'
  }
];

const homeServiceCardImages: Record<string, string> = {
  'Jet Ski Rentals': '/images/edrive/home/home-jet-ski-rentals.webp',
  'Jet Car Rentals': '/images/edrive/home/home-jet-car-rentals.webp',
  'VIP Marine Support': '/images/edrive/home/home-membership-gold-card.webp'
};

const homeServiceCards = serviceCards.map((item) => ({
  ...item,
  image: homeServiceCardImages[item.title] ?? item.image
}));

const whyChoose = [
  { icon: MapPin, title: 'Dubai Islands Location', text: `Start your ride from ${companyInfo.locationName} with clear arrival guidance and team support.` },
  { icon: ShieldCheck, title: 'Safety First', text: 'Every experience includes a safety briefing, life jacket support, and guidance from the eDrive team.' },
  { icon: MessageCircle, title: 'Fast WhatsApp Support', text: 'Get quick help with availability, timing, ride options, and special requests before you arrive.' },
  { icon: CalendarCheck, title: 'Easy Booking', text: 'Choose your ride, duration, date, time, and guest count, then submit your request in minutes.' }
];

const bookingSteps = [
  { icon: Sparkles, title: 'Choose your ride', text: 'Select jet ski, jet car, VIP support, or a package that matches your group and timing.' },
  { icon: CalendarCheck, title: 'Pick date and time', text: 'Share your preferred slot, guest count, and any celebration or group details.' },
  { icon: MessageCircle, title: 'Team confirms', text: 'Our team checks availability and confirms the final details before your water sports experience.' }
];

const membershipTiers = [
  {
    name: 'Explorer Member',
    bestFor: 'Tourists, occasional riders, and first-time customers',
    benefits: ['Member-only offers', 'Priority WhatsApp support', 'Birthday discount', 'Ride recommendations']
  },
  {
    name: 'Premium Member',
    bestFor: 'Dubai residents, repeat riders, couples, and small groups',
    benefits: ['Better booking support', 'Priority slots', 'Weekday offers', 'Friends/family add-on support']
  },
  {
    name: 'VIP Marine Member',
    bestFor: 'VIP customers, private groups, and luxury clients',
    benefits: ['VIP planning', 'Priority sunset slots', 'Custom ride support', 'Dedicated contact flow']
  }
];

export function HomePage() {
  return (
    <>
      <HomeHero />

      <LivePackageShowcase
        title="Dubai Water Sports Packages"
        text="Choose from premium jet ski and jet car ride options with clear pricing, flexible durations, and fast booking support from Dubai Islands."
        limit={6}
        compact
      />

      <section className="bg-[#f4f5f5]">
        <div className={cn('container-x', sectionPad)}>
          <SectionHeader title="Premium Water Sports Experiences" text="Plan jet ski rentals, jet car rides, VIP marine support, and special Dubai water sports moments with eDrive." />
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {homeServiceCards.map((item) => <ServiceCard key={item.title} {...item} />)}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-white/70">
        <div className={cn('container-x', sectionPad)}>
          <SectionHeader title="Why Choose eDrive" text="A premium Dubai water sports experience built around clear packages, safety support, smooth booking, and guest-focused service." />
          <FeatureGrid items={whyChoose} className="mt-7 lg:grid-cols-4" />
        </div>
      </section>

      <section className="bg-[#f4f5f5]">
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

function HomeHero() {
  return (
    <section className={publicHeroFrameClass} data-public-hero>
      <HeroVideoMedia fallbackImage={dubaiWaterfrontImage} fallbackAlt="Jet ski and jet car riding across the Dubai waterfront" priority objectPosition="object-[68%_68%]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,27,39,0.98)_0%,rgba(5,35,48,0.90)_34%,rgba(5,35,48,0.38)_58%,rgba(5,35,48,0.04)_82%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,23,33,0.36)_0%,transparent_38%,rgba(4,23,33,0.24)_100%)]" />

      <div className={publicHeroContentClass}>
        <MotionReveal>
          <div className="max-w-2xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-accent-300">eDrive Water Sports</p>
            <h1 className="font-heading text-4xl font-semibold leading-[1.03] text-white sm:text-5xl lg:text-[3.45rem]">
              Jet Ski & Jet Car
              <span className="mt-1 block text-primary-300">Dubai Islands</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/82 sm:text-lg">Book premium jet ski rentals, luxury jet car rides, and Dubai water sports experiences with clear pricing and fast support.</p>
            <div className="mt-8 flex">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 w-auto items-center justify-center gap-2 rounded-full border border-emerald-300/45 bg-[#25D366] px-6 text-sm font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.32),0_14px_28px_rgba(37,211,102,0.22)] transition hover:-translate-y-0.5 hover:bg-[#1EBE5D] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.38),0_18px_36px_rgba(37,211,102,0.30)]"
              >
                <span>Check Availability</span>
                <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
              </a>
            </div>
          </div>
        </MotionReveal>
      </div>
    </section>
  );
}

export function FleetPage() {
  return (
    <>
      <PublicHero
        title="Premium Jet Ski & Jet Car Fleet Dubai"
        text="Explore eDrive Water Sports ride options for jet ski rentals, luxury jet car experiences, family rides, group bookings, and VIP marine moments."
        image={fleetHeroImage}
        imageAlt="Premium eDrive jet ski and jet car fleet in Dubai"
        actions={[
          { href: '/booking', label: 'Book Now', icon: CalendarCheck },
          { href: '/contact', label: 'Contact eDrive', icon: MessageCircle, variant: 'gold' }
        ]}
      />

      <section className={cn('container-x', sectionPad)}>
        <SectionHeader title="Ride Types" text="Choose the ride style that matches your group size, preferred timing, and Dubai water sports experience." />
        <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {serviceCards.map((item) => <ServiceCard key={item.title} {...item} />)}
        </div>
      </section>

      <section className="border-y border-border bg-white/70">
        <div className={cn('container-x', sectionPad)}>
          <SectionHeader title="Fleet Support" text="Every ride is prepared with team assistance, safety briefing, clear arrival guidance, and booking confirmation before your experience." />
          <FeatureGrid items={whyChoose} className="mt-7 lg:grid-cols-4" />
        </div>
      </section>
    </>
  );
}

export function MembershipPage() {
  return (
    <>
      <PublicHero
        title="eDrive Water Sports Membership"
        text="Get priority support, special offers, and better ride planning for repeat customers, Dubai residents, couples, groups, and VIP guests."
        image={dubaiWaterfrontImage}
        imageAlt="eDrive Water Sports membership in Dubai"
        actions={[
          { href: '/contact', label: 'Apply for Membership', icon: Crown },
          { href: '/booking', label: 'Book a Ride', icon: CalendarCheck, variant: 'outline' },
          { href: whatsappUrl, label: 'WhatsApp Team', icon: MessageCircle, variant: 'gold', external: true }
        ]}
      />

      <section className={cn('container-x', sectionPad)}>
        <SectionHeader title="Membership Tiers" text="Choose the support level that matches your ride style and our team will confirm the latest available benefits directly." />
        <div className="mt-7 grid gap-5 lg:grid-cols-3">
          {membershipTiers.map((tier) => <MembershipTierCard key={tier.name} tier={tier} />)}
        </div>
      </section>
    </>
  );
}

export function BookingPage() {
  return (
    <>
      <section className="container-x pt-8 text-center sm:pt-10">
        <h1 className="mx-auto max-w-3xl font-heading text-4xl font-semibold leading-tight text-foreground sm:text-5xl">Book Your Dubai Water Sports Experience</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">Choose your jet ski or jet car package, preferred date, time, guests, and contact details. Our team will confirm availability and final ride instructions.</p>
      </section>
      <BookingForm />
    </>
  );
}

export function ContactPage() {
  const contacts = [
    { icon: MessageCircle, title: 'WhatsApp', text: companyInfo.whatsappDisplay, href: whatsappUrl, external: true },
    { icon: Phone, title: 'Call Now', text: companyInfo.landlineDisplay, href: `tel:${companyInfo.landlineHref}` },
    { icon: Mail, title: 'Booking Email', text: companyInfo.bookingEmail, href: `mailto:${companyInfo.bookingEmail}` },
    { icon: MapPin, title: 'Get Directions', text: companyInfo.locationName, href: companyInfo.mapLink, external: true }
  ];

  return (
    <>
      <PublicHero
        title="Contact eDrive Water Sports Dubai"
        text={`Visit eDrive Water Sports at ${companyInfo.locationName} or contact our team for jet ski rentals, jet car rides, packages, membership, and guest support.`}
        image={jetCarLightImage}
        imageAlt="Contact eDrive Water Sports Dubai"
        actions={[
          { href: whatsappUrl, label: 'WhatsApp Us', icon: MessageCircle, external: true },
          { href: `tel:${companyInfo.landlineHref}`, label: 'Call Now', icon: Phone, variant: 'outline', external: true },
          { href: '/booking', label: 'Book Now', icon: CalendarCheck, variant: 'gold' }
        ]}
      />
      <section className={cn('container-x grid gap-6 lg:grid-cols-[0.8fr_1.2fr]', sectionPad)}>
        <div className="space-y-4">
          {contacts.map((item) => {
            const Icon = item.icon;
            const content = (
              <Card className="premium-card-hover">
                <CardContent className="flex items-center gap-4 p-4">
                  <span className="flex size-12 items-center justify-center rounded-md bg-primary-50 text-primary"><Icon data-icon aria-hidden="true" /></span>
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">{item.title}</p>
                    <p className="text-base font-semibold text-foreground">{item.text}</p>
                  </div>
                </CardContent>
              </Card>
            );
            return item.external ? <a key={item.title} href={item.href} target="_blank" rel="noopener noreferrer">{content}</a> : <a key={item.title} href={item.href}>{content}</a>;
          })}
        </div>
        <ContactForm />
      </section>
    </>
  );
}

function PublicHero({ title, text, image, imageAlt, actions = [] }: { title: string; text: string; image: string; imageAlt: string; actions?: HeroAction[] }) {
  return <PublicVideoHero title={title} text={text} fallbackImage={image} fallbackAlt={imageAlt} actions={actions} />;
}

function SectionHeader({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h2 className="section-title">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">{text}</p>
    </div>
  );
}

function ServiceCard({ icon: Icon, title, text, image, href, cta }: { icon: LucideIcon; title: string; text: string; image: string; href: string; cta: string }) {
  return (
    <Card className="premium-card-hover overflow-hidden rounded-[1.5rem]">
      <Image src={image} alt={title} width={900} height={600} className="h-56 w-full object-cover" />
      <CardContent className="p-5">
        <span className="mb-4 flex size-11 items-center justify-center rounded-md bg-primary-50 text-primary"><Icon data-icon aria-hidden="true" /></span>
        <h3 className="font-heading text-2xl font-semibold text-foreground">{title}</h3>
        <p className="mt-3 min-h-[5.5rem] text-sm leading-7 text-muted-foreground">{text}</p>
        <Button asChild className="mt-4 w-full rounded-full"><Link href={href}>{cta}<ArrowRight data-icon aria-hidden="true" /></Link></Button>
      </CardContent>
    </Card>
  );
}

function FeatureGrid({ items, className }: { items: { icon: LucideIcon; title: string; text: string }[]; className?: string }) {
  return <div className={cn('grid gap-4 md:grid-cols-2', className)}>{items.map((item) => <FeatureCard key={item.title} item={item} />)}</div>;
}

function FeatureCard({ item }: { item: { icon: LucideIcon; title: string; text: string } }) {
  const Icon = item.icon;
  return (
    <Card className="premium-card-hover">
      <CardContent className="p-5">
        <span className="mb-4 flex size-10 items-center justify-center rounded-md bg-primary-50 text-primary"><Icon data-icon aria-hidden="true" /></span>
        <h3 className="font-semibold text-foreground">{item.title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p>
      </CardContent>
    </Card>
  );
}

function MembershipTierCard({ tier }: { tier: { name: string; bestFor: string; benefits: string[] } }) {
  return (
    <Card className="premium-card-hover">
      <CardContent className="p-6">
        <h3 className="font-heading text-2xl font-semibold text-foreground">{tier.name}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{tier.bestFor}</p>
        <ul className="mt-5 grid gap-3">
          {tier.benefits.map((benefit) => <li key={benefit} className="flex items-center gap-3 text-sm text-foreground"><CheckCircle2 className="size-4 text-primary" aria-hidden="true" />{benefit}</li>)}
        </ul>
      </CardContent>
    </Card>
  );
}

function HomeContactStrip() {
  return (
    <section className="bg-[#f4f5f5] pb-10 sm:pb-12 lg:pb-14">
      <div className="container-x">
        <div className="flex flex-col gap-4 rounded-[1.5rem] bg-primary-900 p-5 text-white shadow-xl lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent-300">Need help choosing?</p>
            <h2 className="mt-2 font-heading text-2xl font-semibold">Talk to eDrive before you book.</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">Tell us your date, number of guests, and whether you prefer a jet ski rental, jet car ride, family package, combo ride, or VIP experience.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild className="rounded-full bg-emerald-500 hover:bg-emerald-600"><a href={whatsappUrl} target="_blank" rel="noopener noreferrer"><MessageCircle data-icon aria-hidden="true" />Chat on WhatsApp</a></Button>
            <Button asChild variant="outline" className="rounded-full bg-white text-primary-900 hover:bg-primary-50"><a href={`tel:${companyInfo.landlineHref}`}><Phone data-icon aria-hidden="true" />Call Now</a></Button>
          </div>
        </div>
      </div>
    </section>
  );
}
