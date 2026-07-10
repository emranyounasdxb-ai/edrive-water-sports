import Image from 'next/image';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  CalendarCheck,
  Car,
  CheckCircle2,
  Crown,
  LifeBuoy,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Users,
  Waves
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { companyInfo, whatsappUrl } from '@/lib/company-info';
import { dubaiWaterfrontImage, fleetHeroImage, fleetShowcaseImage, jetCarLightImage, jetSkiLightImage } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { BookingForm } from './booking-form';
import { ContactForm } from './contact-form';
import { LivePackageShowcase } from './live-package-showcase';
import { MotionReveal } from './motion-reveal';

const sectionPad = 'py-10 sm:py-12 lg:py-14';

type HeroAction = {
  href: string;
  label: string;
  icon: LucideIcon;
  variant?: 'default' | 'outline' | 'gold';
  external?: boolean;
};

const serviceCards = [
  {
    icon: Waves,
    title: 'Jet Ski Experiences',
    text: 'Premium jet ski rides with clear duration options, safety briefing, and fast booking confirmation.',
    image: jetSkiLightImage,
    href: '/jet-ski-rentals',
    cta: 'View Jet Ski Packages'
  },
  {
    icon: Car,
    title: 'Jet Car Experiences',
    text: 'Luxury jet car rides for couples, families, photos, birthdays, and premium Dubai water moments.',
    image: jetCarLightImage,
    href: '/jet-car-rentals',
    cta: 'View Jet Car Packages'
  },
  {
    icon: Crown,
    title: 'VIP Marine Support',
    text: 'Private timing, group planning, and elevated guest support for special bookings and VIP requests.',
    image: fleetShowcaseImage,
    href: '/contact',
    cta: 'Request VIP Support'
  }
];

const whyChoose = [
  { icon: MapPin, title: 'Dubai Islands', text: `Plan your ride from ${companyInfo.locationName} with clear arrival guidance.` },
  { icon: ShieldCheck, title: 'Safety First', text: 'Every ride is supported with safety basics, team guidance, and a clear booking flow.' },
  { icon: MessageCircle, title: 'Fast Support', text: 'WhatsApp, phone, and email support are available for questions and confirmations.' },
  { icon: CalendarCheck, title: 'Easy Booking', text: 'Choose your ride type, date, time, guests, and submit the request in minutes.' }
];

const bookingSteps = [
  { icon: Sparkles, title: 'Choose package', text: 'Select an original live package from the approved backend list.' },
  { icon: CalendarCheck, title: 'Pick date and time', text: 'Share your preferred slot and guest count in the booking form.' },
  { icon: MessageCircle, title: 'Team confirms', text: 'The eDrive team confirms availability and final booking details.' }
];

const membershipTiers = [
  {
    name: 'Explorer Member',
    bestFor: 'Tourists, occasional riders, first-time customers',
    benefits: ['Member-only offers', 'Priority WhatsApp support', 'Birthday discount', 'Ride recommendations']
  },
  {
    name: 'Premium Member',
    bestFor: 'Dubai residents, repeat riders, couples, small groups',
    benefits: ['Better booking support', 'Priority slots', 'Weekday offers', 'Friends/family add-on support']
  },
  {
    name: 'VIP Marine Member',
    bestFor: 'VIP customers, private groups, luxury clients',
    benefits: ['VIP planning', 'Priority sunset slots', 'Custom ride support', 'Dedicated contact flow']
  }
];

export function HomePage() {
  return (
    <>
      <HomeHero />

      <LivePackageShowcase
        title="Bookable Packages"
        text="Only active packages from the admin backend are shown here. New packages and price updates will appear from the live package list."
        limit={6}
        compact
      />

      <section className="bg-[#f4f5f5]">
        <div className={cn('container-x', sectionPad)}>
          <SectionHeader title="Premium Water Sports Experiences" text="Choose jet ski, jet car, or VIP marine support. Package pricing is handled from the live backend package list." />
          <div className="mt-7 grid gap-5 md:grid-cols-3">
            {serviceCards.map((item) => <ServiceCard key={item.title} {...item} />)}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-white/70">
        <div className={cn('container-x', sectionPad)}>
          <SectionHeader title="Why Choose eDrive" text="A clean booking experience for Dubai jet ski and jet car guests, focused on real packages, support, and confirmed availability." />
          <FeatureGrid items={whyChoose} className="mt-7 lg:grid-cols-4" />
        </div>
      </section>

      <section className="bg-[#f4f5f5]">
        <div className={cn('container-x grid gap-7 lg:grid-cols-[0.78fr_1.22fr] lg:items-center', sectionPad)}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">How it works</p>
            <h2 className="mt-3 section-title">From package card to confirmed water time</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">The home page is now shorter and booking-focused. Customers see live packages first, then submit a request for confirmation.</p>
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
    <section className="relative isolate min-h-[620px] overflow-hidden bg-primary-900 text-white sm:min-h-[540px] lg:min-h-[490px]">
      <Image src={dubaiWaterfrontImage} alt="Jet ski and jet car riding across the Dubai waterfront" fill priority className="object-cover object-[68%_68%]" sizes="100vw" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,27,39,0.98)_0%,rgba(5,35,48,0.90)_34%,rgba(5,35,48,0.38)_58%,rgba(5,35,48,0.04)_82%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,23,33,0.36)_0%,transparent_38%,rgba(4,23,33,0.24)_100%)]" />

      <div className="container-x relative flex min-h-[620px] items-end pb-6 pt-28 sm:min-h-[540px] sm:items-center sm:pb-10 sm:pt-28 lg:min-h-[490px] lg:pb-8 lg:pt-24">
        <MotionReveal>
          <div className="max-w-2xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-accent-300">eDrive Water Sports</p>
            <h1 className="font-heading text-4xl font-semibold leading-[1.03] text-white sm:text-5xl lg:text-[3.45rem]">
              Premium Water Sports
              <span className="mt-1 block text-primary-300">Dubai Islands</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/82 sm:text-lg">Jet ski and jet car packages with live pricing, clear timing, and fast team confirmation.</p>
            <div className="mt-8 flex max-w-xl flex-col overflow-hidden rounded-[1.2rem] border border-white/16 bg-primary-900/92 shadow-[0_18px_45px_rgba(0,0,0,0.28)] sm:flex-row">
              <Link href="#live-packages" className="inline-flex min-h-14 flex-1 items-center justify-center gap-2 px-5 text-sm font-bold text-accent-300 transition hover:bg-white/10">
                <CalendarCheck className="size-4" aria-hidden="true" />
                View Packages
              </Link>
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-14 flex-[1.1] items-center justify-between gap-3 border-t border-white/12 bg-primary px-5 text-xs font-semibold text-white transition hover:bg-primary-600 sm:border-l sm:border-t-0">
                <span>WhatsApp for availability and support</span>
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
        title="Explore Our Premium Water Sports Fleet"
        text="Choose from premium jet ski and jet car ride types designed for unforgettable Dubai water experiences. Bookable packages will be shown only after original prices are added."
        image={fleetHeroImage}
        imageAlt="Premium eDrive jet ski and jet car fleet in Dubai"
        actions={[
          { href: '/booking', label: 'Book Now', icon: CalendarCheck },
          { href: '/contact', label: 'Contact eDrive', icon: MessageCircle, variant: 'gold' }
        ]}
      />

      <section className={cn('container-x', sectionPad)}>
        <SectionHeader title="Ride Types" text="Clean service information only, without dummy package prices or duplicate location packages." />
        <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {serviceCards.map((item) => <ServiceCard key={item.title} {...item} />)}
        </div>
      </section>

      <section className="border-y border-border bg-white/70">
        <div className={cn('container-x', sectionPad)}>
          <SectionHeader title="Fleet Support" text="Every ride is supported by the eDrive team with briefing, safety basics, arrival guidance, and booking confirmation." />
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
        text="Enjoy priority support, special offers, and better ride planning for repeat customers, residents, groups, and VIP guests."
        image={dubaiWaterfrontImage}
        imageAlt="eDrive Water Sports membership in Dubai"
        actions={[
          { href: '/contact', label: 'Apply for Membership', icon: Crown },
          { href: '/booking', label: 'Book a Ride', icon: CalendarCheck, variant: 'outline' },
          { href: whatsappUrl, label: 'WhatsApp Team', icon: MessageCircle, variant: 'gold', external: true }
        ]}
      />

      <section className={cn('container-x', sectionPad)}>
        <SectionHeader title="Membership Tiers" text="Choose the lead tier that best matches your ride style. The team will confirm current benefits directly." />
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
        <h1 className="mx-auto max-w-3xl font-heading text-4xl font-semibold leading-tight text-foreground sm:text-5xl">Plan your time on the water</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">Share your preferred date, time, guests, and ride notes. The eDrive team will confirm availability and final details.</p>
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
        text={`Visit eDrive Water Sports at ${companyInfo.locationName} or contact our team for bookings, availability, membership, and guest support.`}
        image={jetCarLightImage}
        imageAlt="Contact eDrive Water Sports Dubai"
        actions={[
          { href: whatsappUrl, label: 'WhatsApp Us', icon: MessageCircle, external: true },
          { href: `tel:${companyInfo.landlineHref}`, label: 'Call Now', icon: Phone, variant: 'outline', external: true },
          { href: '/booking', label: 'Book Now', icon: CalendarCheck, variant: 'gold' }
        ]}
      />

      <section className={cn('container-x', sectionPad)}>
        <SectionHeader title="Quick Contact" text="Reach the eDrive team for booking support, timing questions, arrival details, and availability checks." />
        <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {contacts.map((item) => (
            <a key={item.title} href={item.href} target={item.external ? '_blank' : undefined} rel={item.external ? 'noopener noreferrer' : undefined} className="premium-surface premium-card-hover rounded-[1.75rem] p-5">
              <item.icon className="size-6 text-primary" aria-hidden="true" />
              <h2 className="mt-4 font-heading text-xl font-semibold text-foreground">{item.title}</h2>
              <p className="mt-2 break-words text-sm leading-6 text-muted-foreground">{item.text}</p>
            </a>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-white/70">
        <div className={cn('container-x grid gap-7 lg:grid-cols-[0.95fr_1.05fr]', sectionPad)}>
          <ContactForm />
          <Card id="map" className="overflow-hidden p-3">
            <div className="overflow-hidden rounded-[1.5rem]">
              <iframe src={companyInfo.mapEmbedSrc} width="100%" height="430" style={{ border: 0 }} allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" title="eDrive Water Sports location map" className="block w-full" />
            </div>
            <CardContent className="p-5">
              <h2 className="font-heading text-2xl font-semibold text-foreground">{companyInfo.locationName}</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">Use the map for directions to our main Dubai Islands Marina location. For bookings and arrival instructions, contact our team before your ride.</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}

export function LegacyRoutePage({ title, text, href, cta }: { title: string; text: string; href: string; cta: string }) {
  return (
    <section className="container-x py-14 sm:py-16">
      <div className="premium-surface mx-auto max-w-3xl rounded-[2rem] p-7 text-center sm:p-9">
        <h1 className="font-heading text-4xl font-semibold leading-tight text-foreground">{title}</h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">{text}</p>
        <Button asChild className="mt-6"><Link href={href}>{cta}<ArrowRight data-icon aria-hidden="true" /></Link></Button>
      </div>
    </section>
  );
}

function PublicHero({ title, text, image, imageAlt, actions }: { title: string; text: string; image: string; imageAlt: string; actions: HeroAction[] }) {
  return (
    <section className="border-b border-border bg-white/70 soft-grid">
      <div className="container-x grid gap-7 py-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
        <MotionReveal>
          <div className="max-w-2xl">
            <h1 className="font-heading text-3xl font-semibold leading-tight text-foreground sm:text-4xl lg:text-5xl">{title}</h1>
            <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">{text}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {actions.map((action) => <ActionButton key={action.label} action={action} />)}
            </div>
          </div>
        </MotionReveal>
        <div className="relative min-h-[280px] overflow-hidden rounded-[2rem] border border-white/70 shadow-glass lg:min-h-[360px]">
          <Image src={image} alt={imageAlt} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 52vw" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(4,23,33,0.28))]" />
        </div>
      </div>
    </section>
  );
}

function ActionButton({ action }: { action: HeroAction }) {
  const variant = action.variant === 'gold' ? 'gold' : action.variant === 'outline' ? 'outline' : 'default';
  const content = <>{<action.icon data-icon aria-hidden="true" />}{action.label}</>;
  if (action.external) return <Button asChild variant={variant}><a href={action.href} target="_blank" rel="noopener noreferrer">{content}</a></Button>;
  return <Button asChild variant={variant}><Link href={action.href}>{content}</Link></Button>;
}

function SectionHeader({ title, text }: { title: string; text: string }) {
  return (
    <div className="max-w-3xl">
      <h2 className="section-title">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">{text}</p>
    </div>
  );
}

function ServiceCard({ icon: Icon, title, text, image, href, cta }: { icon: LucideIcon; title: string; text: string; image: string; href: string; cta: string }) {
  return (
    <article className="premium-surface premium-card-hover overflow-hidden rounded-[1.75rem] p-3">
      <div className="relative aspect-[16/10] overflow-hidden rounded-[1.35rem] bg-primary-50">
        <Image src={image} alt={title} fill className="object-cover transition duration-700 hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" />
      </div>
      <div className="p-4">
        <span className="flex size-10 items-center justify-center rounded-2xl bg-primary-50 text-primary"><Icon className="size-5" aria-hidden="true" /></span>
        <h3 className="mt-4 font-heading text-2xl font-semibold text-foreground">{title}</h3>
        <p className="mt-2 text-sm leading-7 text-muted-foreground">{text}</p>
        <Button asChild className="mt-5 w-full rounded-full"><Link href={href}>{cta}<ArrowRight data-icon aria-hidden="true" /></Link></Button>
      </div>
    </article>
  );
}

function FeatureGrid({ items, className }: { items: Array<{ icon: LucideIcon; title: string; text: string }>; className?: string }) {
  return (
    <div className={cn('grid gap-4 md:grid-cols-2', className)}>
      {items.map((item) => (
        <div key={item.title} className="premium-surface rounded-[1.5rem] p-5">
          <item.icon className="size-6 text-primary" aria-hidden="true" />
          <h3 className="mt-4 font-heading text-xl font-semibold text-foreground">{item.title}</h3>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.text}</p>
        </div>
      ))}
    </div>
  );
}

function MembershipTierCard({ tier }: { tier: { name: string; bestFor: string; benefits: string[] } }) {
  return (
    <article className="premium-surface premium-card-hover rounded-[1.75rem] p-6">
      <Crown className="size-7 text-primary" aria-hidden="true" />
      <h3 className="mt-4 font-heading text-2xl font-semibold text-foreground">{tier.name}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{tier.bestFor}</p>
      <ul className="mt-5 grid gap-2">
        {tier.benefits.map((benefit) => <li key={benefit} className="flex items-start gap-2 text-sm leading-6 text-muted-foreground"><CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />{benefit}</li>)}
      </ul>
      <Button asChild className="mt-6 w-full rounded-full"><Link href="/contact">Apply Now<ArrowRight data-icon aria-hidden="true" /></Link></Button>
    </article>
  );
}

function HomeContactStrip() {
  return (
    <section className="bg-[#f4f5f5] py-9 sm:py-11">
      <div className="container-x">
        <div className="grid overflow-hidden rounded-[1.5rem] bg-primary-900 text-white shadow-[0_18px_45px_rgba(8,37,50,0.18)] lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="p-6 sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-accent-300">Need help choosing?</p>
            <h2 className="mt-2 font-heading text-2xl font-semibold">Talk to eDrive before you book.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/72">Tell us your date, number of guests, and whether you prefer jet ski, jet car, combo, family, VIP, or special group support.</p>
          </div>
          <div className="flex flex-col gap-2 p-5 sm:flex-row lg:flex-col lg:p-6">
            <Button asChild className="rounded-full bg-[#25D366] text-white hover:bg-[#1EBE5D]"><a href={whatsappUrl} target="_blank" rel="noopener noreferrer"><MessageCircle data-icon aria-hidden="true" />WhatsApp eDrive</a></Button>
            <Button asChild variant="outline" className="rounded-full bg-white text-primary-900 hover:bg-white"><a href={`tel:${companyInfo.landlineHref}`}><Phone data-icon aria-hidden="true" />Call now</a></Button>
          </div>
        </div>
      </div>
    </section>
  );
}
