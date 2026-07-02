import Image from 'next/image';
import Link from 'next/link';
import {
  Anchor,
  ArrowRight,
  CalendarCheck,
  Car,
  CheckCircle2,
  Clock,
  Crown,
  Fuel,
  Gauge,
  ImageIcon,
  LifeBuoy,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Ship,
  ShoppingBag,
  Sparkles,
  Star,
  Ticket,
  Users,
  Waves
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookingForm } from './booking-form';
import { ContactForm } from './contact-form';
import { MotionReveal } from './motion-reveal';
import {
  fleetHeroImage,
  fleetShowcaseImage,
  galleryItems,
  salesListings,
  serviceHighlights,
  testimonials,
  vehicles
} from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const jetSkis = vehicles.filter((vehicle) => vehicle.category === 'Jet Ski' && vehicle.status !== 'For Sale');
const jetCars = vehicles.filter((vehicle) => vehicle.category === 'Jet Car');

export function HomePage() {
  return (
    <>
      <HeroSection />
      <StatsBand />
      <section className="container-x py-16 sm:py-20">
        <SectionIntro
          label="Premium Fleet"
          title="Choose your water signature"
          text="Every ride is staged from a polished marina flow: safety briefing, concierge handoff, optional photo stops, and route support."
          action={{ href: '/booking', label: 'Book Experience' }}
        />
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {vehicles.slice(0, 5).map((vehicle, index) => (
            <MotionReveal key={vehicle.id} delay={index * 0.05}>
              <VehicleCard vehicle={vehicle} />
            </MotionReveal>
          ))}
        </div>
      </section>
      <ExperienceFlow />
      <TestimonialsSection />
      <FinalCta />
    </>
  );
}

export function AboutPage() {
  return (
    <>
      <PageHero
        label="About eDrive"
        title="Luxury water experiences with operational discipline"
        text="eDrive Water Sports blends premium fleet presentation with practical marina operations, making every booking feel calm, cinematic, and well managed."
        image={fleetShowcaseImage}
      />
      <section className="container-x grid gap-6 py-16 lg:grid-cols-3">
        {[
          { icon: Crown, title: 'Premium by default', text: 'High-touch guest handoff, polished vehicle presentation, and refined route planning.' },
          { icon: ShieldCheck, title: 'Safety first', text: 'Briefings, safety equipment, route support, and weather-aware scheduling are part of the flow.' },
          { icon: Sparkles, title: 'Built for moments', text: 'Jet cars, glow-lit fleet visuals, and marina photo stops create memorable premium content.' }
        ].map((item, index) => (
          <MotionReveal key={item.title} delay={index * 0.06}>
            <Card className="h-full">
              <CardHeader>
                <item.icon data-icon aria-hidden="true" className="text-ocean-glow" />
                <CardTitle>{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-7 text-pearl-muted">{item.text}</p>
              </CardContent>
            </Card>
          </MotionReveal>
        ))}
      </section>
      <section className="border-y border-white/10 bg-white/[0.035] py-16 sm:py-20">
        <div className="container-x grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <MotionReveal>
            <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-white/[0.12]">
              <Image src={fleetHeroImage} alt="eDrive fleet at the marina" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 45vw" />
            </div>
          </MotionReveal>
          <MotionReveal delay={0.08}>
            <div className="flex flex-col gap-6">
              <p className="fine-label">Our Standard</p>
              <h2 className="section-title">From dock arrival to open-water return, the experience stays composed.</h2>
              <p className="text-base leading-8 text-pearl-muted">
                The eDrive frontend showcases a luxury rental operation where fleet availability, customer bookings, coupons,
                inventory, reports, and staff planning can all be reviewed through static mock screens before backend integration.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {['VIP dock pickup', 'Guided route options', 'Photo-ready fleet', 'Mock admin cockpit'].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.045] p-4 text-sm font-semibold text-pearl">
                    <CheckCircle2 data-icon aria-hidden="true" className="text-ocean-glow" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </MotionReveal>
        </div>
      </section>
      <FinalCta />
    </>
  );
}

export function JetSkiRentalsPage() {
  return (
    <>
      <PageHero
        label="Jet Ski Rentals"
        title="High-performance rides with a luxury marina handoff"
        text="Select a premium jet ski, choose your time, and arrive to a polished route plan with safety gear ready."
        image={fleetHeroImage}
      />
      <FleetPageContent
        vehicles={jetSkis}
        title="Jet ski fleet"
        text="Hourly mock pricing, specs, and availability states are static for this frontend step."
        icon="ski"
      />
      <IncludedSection />
      <FinalCta />
    </>
  );
}

export function JetCarRentalsPage() {
  return (
    <>
      <PageHero
        label="Jet Car Rentals"
        title="The supercar-on-water moment"
        text="Book a sleek jet car for a marina showcase, coastal cruise, or VIP photo route with captain support included."
        image={fleetShowcaseImage}
      />
      <FleetPageContent
        vehicles={jetCars}
        title="Jet car lineup"
        text="These frontend cards use mock status and pricing while preserving the production booking surface."
        icon="car"
      />
      <section className="container-x grid gap-5 py-16 md:grid-cols-3">
        {[
          { title: 'Marina Showcase', text: 'Short cinematic loop with skyline views and photo stop.', price: 'AED 1,250 / hr' },
          { title: 'Coastal Cruise', text: 'Open-water route with premium captain-led pacing.', price: 'AED 1,650 / 90 min' },
          { title: 'VIP Event Arrival', text: 'Dock staging for birthdays, proposals, and brand shoots.', price: 'Custom quote' }
        ].map((route, index) => (
          <MotionReveal key={route.title} delay={index * 0.05}>
            <Card className="h-full">
              <CardHeader>
                <Badge variant="gold">{route.price}</Badge>
                <CardTitle>{route.title}</CardTitle>
                <CardDescription>{route.text}</CardDescription>
              </CardHeader>
            </Card>
          </MotionReveal>
        ))}
      </section>
      <FinalCta />
    </>
  );
}

export function SalesPage() {
  return (
    <>
      <PageHero
        label="Sales"
        title="Own a marina-ready watercraft"
        text="Browse curated sale inventory, staged here with static mock data for the frontend UI phase."
        image={fleetShowcaseImage}
      />
      <section className="container-x py-16">
        <SectionIntro
          label="Available Listings"
          title="Sales inventory"
          text="Each listing includes service notes, specs, and inquiry CTAs without connecting to a backend."
        />
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {salesListings.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} sale />
          ))}
          <Card className="glass-panel-strong">
            <CardHeader>
              <ShoppingBag data-icon aria-hidden="true" className="text-gold" />
              <CardTitle>Looking for a specific model?</CardTitle>
              <CardDescription>Stage a sales inquiry for sourcing, consignment, or trade-in evaluation.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="gold">
                <Link href="/contact">
                  Start Sales Inquiry
                  <ArrowRight data-icon aria-hidden="true" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}

export function BookingPage() {
  return (
    <>
      <PageHero
        label="Booking"
        title="Plan the ride before the backend arrives"
        text="This screen completes the booking UI with local mock state only. No API route, server action, or database call is used."
        image={fleetHeroImage}
      />
      <section className="container-x grid gap-8 py-16 lg:grid-cols-[1fr_0.75fr]">
        <BookingForm />
        <div className="flex flex-col gap-5">
          {[
            { icon: Clock, title: 'Operating Hours', text: '9:00 AM to 10:00 PM daily' },
            { icon: MapPin, title: 'Dock Points', text: 'Dubai Marina, JBR Beach, Bluewaters' },
            { icon: LifeBuoy, title: 'Included', text: 'Briefing, safety gear, dock coordination, route support' }
          ].map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <item.icon data-icon aria-hidden="true" className="text-ocean-glow" />
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.text}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </>
  );
}

export function GalleryPage() {
  return (
    <>
      <PageHero
        label="Gallery"
        title="A visual fleet built for night water reflections"
        text="Gallery tiles use local generated water-sports visuals so the static export remains self-contained."
        image={fleetShowcaseImage}
      />
      <section className="container-x py-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {galleryItems.map((item, index) => (
            <MotionReveal key={item.title} delay={index * 0.04}>
              <article className="group overflow-hidden rounded-lg border border-white/10 bg-white/[0.045]">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image src={item.image} alt={item.title} fill className="object-cover transition duration-500 group-hover:scale-105" sizes="(max-width: 1024px) 50vw, 33vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ocean-abyss/80 via-transparent to-transparent" />
                </div>
                <div className="flex items-center justify-between gap-4 p-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">{item.category}</p>
                    <h3 className="mt-2 font-heading text-xl font-bold text-pearl">{item.title}</h3>
                  </div>
                  <ImageIcon data-icon aria-hidden="true" className="text-ocean-glow" />
                </div>
              </article>
            </MotionReveal>
          ))}
        </div>
      </section>
    </>
  );
}

export function ContactPage() {
  return (
    <>
      <PageHero
        label="Contact"
        title="Speak with the marina concierge"
        text="Use the frontend-only contact composer or reach the mock team details shown below."
        image={fleetHeroImage}
      />
      <section className="container-x grid gap-8 py-16 lg:grid-cols-[0.75fr_1fr]">
        <div className="flex flex-col gap-5">
          {[
            { icon: Phone, title: 'Phone', text: '+971 50 123 4567', href: 'tel:+971501234567' },
            { icon: Mail, title: 'Email', text: 'bookings@edrivewatersports.ae', href: 'mailto:bookings@edrivewatersports.ae' },
            { icon: MapPin, title: 'Marina', text: 'Dubai Marina Walk, UAE', href: 'https://maps.google.com' }
          ].map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <item.icon data-icon aria-hidden="true" className="text-ocean-glow" />
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>
                  <a href={item.href} className="transition hover:text-ocean-glow">{item.text}</a>
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
        <ContactForm />
      </section>
    </>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-[calc(86vh-5rem)] overflow-hidden">
      <Image src={fleetShowcaseImage} alt="Luxury jet ski and jet car on Dubai marina water" fill priority className="object-cover" sizes="100vw" />
      <div className="absolute inset-0 bg-gradient-to-r from-ocean-abyss via-ocean-abyss/[0.78] to-ocean-abyss/[0.22]" />
      <div className="absolute inset-0 ocean-grid" />
      <div className="relative container-x flex min-h-[calc(86vh-5rem)] items-center py-14 sm:py-16">
        <div className="grid w-full gap-10 lg:grid-cols-[1fr_0.8fr] lg:items-end">
          <MotionReveal>
            <div className="max-w-3xl">
              <p className="fine-label">Experience Freedom. Drive the Ocean.</p>
              <h1 className="heading-luxury mt-5">
                Premium Water Sports <span className="text-gradient-ocean">Rentals</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-pearl-muted sm:text-lg">
                Jet skis, jet cars, sales, and private marina moments built with a premium static frontend ready for your backend later.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button asChild variant="gold" size="lg">
                  <Link href="/booking">
                    Book Your Experience
                    <ArrowRight data-icon aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/jet-ski-rentals">
                    Explore Fleet
                    <Ship data-icon aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </div>
          </MotionReveal>
          <MotionReveal delay={0.12} className="hidden lg:block">
            <div className="glass-panel-strong rounded-lg p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { icon: Waves, label: 'Activity', value: 'Jet Ski + Jet Car' },
                  { icon: CalendarCheck, label: 'Date', value: 'Jul 04, 2026' },
                  { icon: Users, label: 'Guests', value: '2-6 riders' },
                  { icon: MapPin, label: 'Location', value: 'Dubai Marina' }
                ].map((item) => (
                  <div key={item.label} className="rounded-md border border-white/10 bg-white/[0.045] p-4">
                    <item.icon data-icon aria-hidden="true" className="text-ocean-glow" />
                    <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">{item.label}</p>
                    <p className="mt-1 text-sm font-semibold text-pearl">{item.value}</p>
                  </div>
                ))}
              </div>
              <Button asChild className="mt-4 w-full" variant="gold">
                <Link href="/booking">Check Availability</Link>
              </Button>
            </div>
          </MotionReveal>
        </div>
      </div>
    </section>
  );
}

function PageHero({ label, title, text, image }: { label: string; title: string; text: string; image: string }) {
  return (
    <section className="relative overflow-hidden border-b border-white/10">
      <div className="absolute inset-0">
        <Image src={image} alt="" fill priority className="object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-r from-ocean-abyss via-ocean-abyss/[0.82] to-ocean-abyss/[0.35]" />
        <div className="absolute inset-0 ocean-grid" />
      </div>
      <div className="relative container-x py-20 sm:py-24 lg:py-28">
        <MotionReveal>
          <div className="max-w-3xl">
            <p className="fine-label">{label}</p>
            <h1 className="heading-luxury mt-5">{title}</h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-pearl-muted sm:text-lg">{text}</p>
          </div>
        </MotionReveal>
      </div>
    </section>
  );
}

function SectionIntro({ label, title, text, action }: { label: string; title: string; text: string; action?: { href: string; label: string } }) {
  return (
    <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
      <div className="max-w-3xl">
        <p className="fine-label">{label}</p>
        <h2 className="section-title mt-3">{title}</h2>
        <p className="mt-4 text-sm leading-7 text-pearl-muted sm:text-base">{text}</p>
      </div>
      {action ? (
        <Button asChild variant="outline">
          <Link href={action.href}>
            {action.label}
            <ArrowRight data-icon aria-hidden="true" />
          </Link>
        </Button>
      ) : null}
    </div>
  );
}

function StatsBand() {
  return (
    <section className="border-y border-white/10 bg-white/[0.035]">
      <div className="container-x grid gap-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
        {serviceHighlights.map((item, index) => (
          <MotionReveal key={item.label} delay={index * 0.04}>
            <div className="rounded-lg border border-white/10 bg-white/[0.045] p-5 text-center">
              <p className="font-heading text-4xl font-bold text-pearl">{item.value}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{item.label}</p>
            </div>
          </MotionReveal>
        ))}
      </div>
    </section>
  );
}

function VehicleCard({ vehicle, sale = false }: { vehicle: (typeof vehicles)[number]; sale?: boolean }) {
  const statusVariant = vehicle.status === 'Available' ? 'success' : vehicle.status === 'Maintenance' ? 'warning' : vehicle.status === 'For Sale' ? 'gold' : 'secondary';

  return (
    <Card className="group h-full overflow-hidden">
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image src={vehicle.image} alt={vehicle.name} fill className="object-cover transition duration-500 group-hover:scale-105" sizes="(max-width: 1024px) 100vw, 33vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-ocean-abyss/80 via-transparent to-transparent" />
        <div className="absolute left-4 top-4 flex gap-2">
          <Badge variant="gold">{vehicle.tag}</Badge>
          <Badge variant={statusVariant}>{vehicle.status}</Badge>
        </div>
      </div>
      <CardHeader>
        <CardTitle>{vehicle.name}</CardTitle>
        <CardDescription>{vehicle.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid grid-cols-3 gap-3 text-xs text-pearl-muted">
          <Spec icon={Users} value={`${vehicle.seats} seats`} />
          <Spec icon={Gauge} value={`${vehicle.horsepower} HP`} />
          <Spec icon={Fuel} value={vehicle.range} />
        </div>
        <div className="flex flex-wrap gap-2">
          {vehicle.specs.map((spec) => (
            <Badge key={spec} variant="secondary">{spec}</Badge>
          ))}
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-4">
          <p className="font-heading text-2xl font-bold text-pearl">
            {sale ? `AED ${vehicle.hourlyRate.toLocaleString()}` : `AED ${vehicle.hourlyRate}`}
            {!sale ? <span className="font-sans text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"> / hr</span> : null}
          </p>
          <Button asChild variant="outline" size="sm">
            <Link href={sale ? '/contact' : '/booking'}>
              {sale ? 'Inquire' : 'Book'}
              <ArrowRight data-icon aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Spec({ icon: Icon, value }: { icon: typeof Users; value: string }) {
  return (
    <div className="flex min-h-16 flex-col justify-center gap-2 rounded-md border border-white/10 bg-white/[0.04] p-3">
      <Icon data-icon aria-hidden="true" className="text-ocean-glow" />
      <span>{value}</span>
    </div>
  );
}

function FleetPageContent({ vehicles: items, title, text, icon }: { vehicles: typeof vehicles; title: string; text: string; icon: 'ski' | 'car' }) {
  const Icon = icon === 'car' ? Car : Waves;
  return (
    <section className="container-x py-16">
      <SectionIntro label="Fleet Selection" title={title} text={text} action={{ href: '/booking', label: 'Reserve Now' }} />
      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        {items.map((vehicle, index) => (
          <MotionReveal key={vehicle.id} delay={index * 0.05}>
            <VehicleCard vehicle={vehicle} />
          </MotionReveal>
        ))}
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {[
          { title: 'Briefing Included', text: 'Guests get a route and safety briefing before leaving the dock.' },
          { title: 'Photo Route Ready', text: 'Mock route options focus on skyline, marina, and calm-water scenes.' },
          { title: 'Concierge Handoff', text: 'The frontend flow supports premium arrival and return states.' }
        ].map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <Icon data-icon aria-hidden="true" className="text-ocean-glow" />
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>{item.text}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
}

function IncludedSection() {
  return (
    <section className="border-y border-white/10 bg-white/[0.035] py-16">
      <div className="container-x">
        <SectionIntro label="Included" title="Everything needed for a polished ride" text="The UI shows inclusions clearly so pricing and expectations are easy to scan on mobile." />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: ShieldCheck, title: 'Safety Gear' },
            { icon: Anchor, title: 'Dock Support' },
            { icon: Ticket, title: 'Mock Coupon Ready' },
            { icon: Star, title: 'Premium Add-ons' }
          ].map((item) => (
            <div key={item.title} className="rounded-lg border border-white/10 bg-white/[0.045] p-5">
              <item.icon data-icon aria-hidden="true" className="text-ocean-glow" />
              <p className="mt-4 font-semibold text-pearl">{item.title}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ExperienceFlow() {
  return (
    <section className="border-y border-white/10 bg-ocean-deep/[0.62] py-16 sm:py-20">
      <div className="container-x">
        <SectionIntro label="Flow" title="A booking path designed for calm execution" text="The frontend contains every customer-facing step without adding server actions or backend calls." />
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            { title: 'Select', text: 'Choose jet ski, jet car, sales inquiry, or group experience.' },
            { title: 'Stage', text: 'Enter mock schedule, guests, and route notes in the local form.' },
            { title: 'Arrive', text: 'Use the completed UI as the future handoff to booking operations.' }
          ].map((step, index) => (
            <MotionReveal key={step.title} delay={index * 0.05}>
              <Card className="h-full">
                <CardHeader>
                  <span className="font-heading text-5xl font-bold text-gold">{String(index + 1).padStart(2, '0')}</span>
                  <CardTitle>{step.title}</CardTitle>
                  <CardDescription>{step.text}</CardDescription>
                </CardHeader>
              </Card>
            </MotionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="container-x py-16 sm:py-20">
      <SectionIntro label="Guest Perspective" title="Luxury cues, practical clarity" text="Testimonials are static mock content for visual completeness." />
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {testimonials.map((item, index) => (
          <MotionReveal key={item.name} delay={index * 0.05}>
            <Card className="h-full">
              <CardHeader>
                <div className="flex gap-1 text-gold">
                  {Array.from({ length: 5 }).map((_, starIndex) => (
                    <Star key={starIndex} data-icon aria-hidden="true" />
                  ))}
                </div>
                <CardDescription className="text-base leading-7 text-pearl-muted">“{item.quote}”</CardDescription>
                <CardTitle className="text-lg">{item.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{item.role}</p>
              </CardHeader>
            </Card>
          </MotionReveal>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="container-x pb-16 sm:pb-20">
      <div className="glass-panel-strong rounded-lg p-6 sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="fine-label">Ready When You Are</p>
            <h2 className="section-title mt-3">Make the marina your first screen.</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-pearl-muted">
              Bookings, contact, sales, and admin are currently static mock flows, ready for future integration after this frontend step.
            </p>
          </div>
          <Button asChild variant="gold" size="lg">
            <Link href="/booking">
              Start Booking
              <ArrowRight data-icon aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
