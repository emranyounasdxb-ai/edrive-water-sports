import Image from 'next/image';
import Link from 'next/link';
import {
  Anchor,
  ArrowRight,
  CalendarCheck,
  Car,
  CheckCircle2,
  Clock,
  Headphones,
  LifeBuoy,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Ship,
  ShoppingBag,
  Sparkles,
  Star,
  Sun,
  Users,
  Waves
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  dubaiWaterfrontImage,
  galleryItems,
  jetCarLightImage,
  jetSkiLightImage,
  salesListings,
  testimonials,
  vehicles
} from '@/lib/mock-data';
import { BookingForm } from './booking-form';
import { ContactForm } from './contact-form';
import { MotionReveal } from './motion-reveal';

const jetSkis = vehicles.filter((vehicle) => vehicle.category === 'Jet Ski' && vehicle.status !== 'For Sale');
const jetCars = vehicles.filter((vehicle) => vehicle.category === 'Jet Car' && vehicle.status !== 'For Sale');

const services = [
  { icon: Waves, title: 'Jet Ski Rentals', text: 'Responsive premium craft for first-time riders, touring, and high-performance sessions.', href: '/jet-ski-rentals', image: jetSkiLightImage },
  { icon: Car, title: 'Jet Car Rentals', text: 'A private supercar-on-water experience with a captain and Dubai Marina photo route.', href: '/jet-car-rentals', image: jetCarLightImage },
  { icon: ShoppingBag, title: 'Jet Ski Sales', text: 'Marina-ready new and pre-owned watercraft with clear history and practical handover support.', href: '/sales', image: jetSkiLightImage },
  { icon: Ship, title: 'Jet Car Sales', text: 'Selected jet cars for private owners, hospitality partners, and commercial operators.', href: '/sales', image: jetCarLightImage }
];

const trustItems = [
  { icon: Sparkles, title: 'Premium Fleet', text: 'Clean, maintained craft prepared before every departure.' },
  { icon: MapPin, title: 'Dubai Marina Experience', text: 'Routes shaped around the city skyline and calm water.' },
  { icon: ShieldCheck, title: 'Safety Focused', text: 'Briefing, life jackets, and dock support included.' },
  { icon: CalendarCheck, title: 'Easy Booking', text: 'Choose your ride and preferred time in a few steps.' },
  { icon: MessageCircle, title: 'WhatsApp Support', text: 'Local help before, during, and after your experience.' }
];

export function HomePage() {
  return (
    <>
      <HomeHero />
      <ServiceOverview />
      <MarinaExperience />
      <TrustBand />
      <section className="container-x py-16 sm:py-20">
        <SectionIntro title="A fleet prepared for the way you want to ride" text="From comfortable touring jet skis to statement-making jet cars, every option includes clear pricing, location, capacity, and direct booking." action={{ href: '/booking', label: 'Check availability' }} />
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {vehicles.filter((vehicle) => vehicle.status !== 'For Sale').slice(0, 3).map((vehicle, index) => (
            <MotionReveal key={vehicle.id} delay={index * 0.04}><VehicleCard vehicle={vehicle} /></MotionReveal>
          ))}
        </div>
      </section>
      <TestimonialsSection />
      <BookingCta />
    </>
  );
}

export function AboutPage() {
  return (
    <>
      <PageHero title="Made for memorable days on Dubai water" text="eDrive Water Sports brings together a carefully presented fleet, experienced local support, and a straightforward booking journey from Dubai Marina." image={dubaiWaterfrontImage} />
      <section className="container-x grid gap-12 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center sm:py-20">
        <MotionReveal>
          <div className="relative aspect-[4/5] overflow-hidden rounded-lg shadow-premium">
            <Image src={jetSkiLightImage} alt="Premium jet skis prepared at Dubai Marina" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 42vw" />
          </div>
        </MotionReveal>
        <MotionReveal delay={0.06}>
          <div className="flex flex-col gap-6">
            <h2 className="section-title">A polished marina experience, without the fuss</h2>
            <p className="text-base leading-8 text-muted-foreground">Our team prepares the craft, safety equipment, route guidance, and dock handover before you arrive. Guests get the excitement of Dubai from the water with the confidence of a well-run local operation.</p>
            <p className="text-base leading-8 text-muted-foreground">Whether you are booking a first jet ski ride, planning a private celebration, or exploring ownership, we keep the advice clear and the experience personal.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {['Daily marina departures', 'Premium safety equipment', 'Private and group bookings', 'Sales and ownership guidance'].map((item) => (
                <div key={item} className="flex items-center gap-3 border-b border-border pb-4 text-sm font-semibold text-foreground">
                  <CheckCircle2 className="size-5 text-primary" aria-hidden="true" />{item}
                </div>
              ))}
            </div>
            <Button asChild className="w-fit"><Link href="/booking">Plan your experience <ArrowRight data-icon aria-hidden="true" /></Link></Button>
          </div>
        </MotionReveal>
      </section>
      <section className="border-y border-border bg-white py-16">
        <div className="container-x grid gap-8 md:grid-cols-3">
          {[
            { icon: Sparkles, title: 'Thoughtful presentation', text: 'Clean craft, clear arrival instructions, and a calm dock handover set the tone.' },
            { icon: ShieldCheck, title: 'Practical safety', text: 'Every experience starts with equipment checks, local guidance, and a route briefing.' },
            { icon: Headphones, title: 'Local support', text: 'Our booking team stays available by phone and WhatsApp when plans need attention.' }
          ].map((item) => <OpenFeature key={item.title} {...item} />)}
        </div>
      </section>
      <BookingCta />
    </>
  );
}

export function JetSkiRentalsPage() {
  return (
    <>
      <PageHero title="Feel Dubai from the water" text="Choose a premium jet ski, meet us at Dubai Marina, and ride with quality safety equipment and local route guidance included." image={jetSkiLightImage} />
      <FleetPageContent items={jetSkis} title="Choose your jet ski" text="Comfortable cruisers and responsive performance models for solo riders, couples, and guided sessions." />
      <IncludedSection type="jet ski" />
      <BookingCta />
    </>
  );
}

export function JetCarRentalsPage() {
  return (
    <>
      <PageHero title="Dubai's most distinctive water ride" text="Take the wheel of a premium jet car with captain support, a private marina route, and an unmatched view of the waterfront." image={jetCarLightImage} />
      <FleetPageContent items={jetCars} title="Choose your jet car" text="Private two-seat experiences for celebrations, content days, relaxed cruises, and unforgettable arrivals." />
      <section className="border-y border-border bg-white py-16">
        <div className="container-x">
          <SectionIntro title="Choose the pace of your experience" text="Tell us what the occasion calls for and we will help shape the right route." />
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { title: 'Marina Discovery', text: 'A relaxed skyline loop with time for waterfront photographs.', price: 'From AED 1,100 / hr' },
              { title: 'Celebration Cruise', text: 'A private route for birthdays, proposals, and special occasions.', price: 'From AED 1,350 / hr' },
              { title: 'Content Session', text: 'Flexible pacing and planned stops for personal or brand photography.', price: 'Custom quote' }
            ].map((route) => (
              <Card key={route.title} className="h-full">
                <CardHeader><CardTitle>{route.title}</CardTitle><CardDescription>{route.text}</CardDescription></CardHeader>
                <CardContent><p className="text-sm font-semibold text-primary">{route.price}</p></CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      <BookingCta />
    </>
  );
}

export function SalesPage() {
  return (
    <>
      <PageHero title="Own the experience" text="Explore selected jet skis and jet cars with straightforward specifications, condition notes, and personal sales support." image={dubaiWaterfrontImage} />
      <section className="container-x py-16 sm:py-20">
        <SectionIntro title="Watercraft available now" text="Browse selected new and pre-owned craft, with clear specifications and direct support for viewings and ownership questions." />
        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {salesListings.map((vehicle) => <VehicleCard key={vehicle.id} vehicle={vehicle} sale />)}
          <Card className="h-full bg-primary-50">
            <CardHeader><ShoppingBag className="size-6 text-primary" aria-hidden="true" /><CardTitle>Looking for a specific model?</CardTitle><CardDescription>Share your preferred craft, budget, and intended use. Our team can help with sourcing, trade-in, or consignment options.</CardDescription></CardHeader>
            <CardContent><Button asChild><Link href="/contact">Start a sales inquiry <ArrowRight data-icon aria-hidden="true" /></Link></Button></CardContent>
          </Card>
        </div>
      </section>
      <section className="border-y border-border bg-white py-16"><div className="container-x grid gap-8 md:grid-cols-3">{[
        { icon: ShieldCheck, title: 'Clear condition notes', text: 'Service history and key condition details presented before a viewing.' },
        { icon: Anchor, title: 'Marina-ready handover', text: 'Practical guidance on transport, dock setup, and first use.' },
        { icon: Headphones, title: 'Ownership support', text: 'A direct point of contact for questions throughout the sales process.' }
      ].map((item) => <OpenFeature key={item.title} {...item} />)}</div></section>
    </>
  );
}

export function BookingPage() {
  return (
    <>
      <PageHero title="Book your time on the water" text="Choose your experience and preferred schedule. Our team will confirm availability and final details with you directly." image={dubaiWaterfrontImage} compact />
      <section className="container-x grid gap-8 py-16 lg:grid-cols-[1fr_0.62fr]">
        <BookingForm />
        <div className="flex flex-col gap-5">
          <Card><CardHeader><Clock className="size-6 text-primary" aria-hidden="true" /><CardTitle>Daily departures</CardTitle><CardDescription>9:00 AM to 8:00 PM, subject to weather and marine conditions.</CardDescription></CardHeader></Card>
          <Card><CardHeader><MapPin className="size-6 text-primary" aria-hidden="true" /><CardTitle>Dubai Marina</CardTitle><CardDescription>Final meeting point and arrival instructions are shared after confirmation.</CardDescription></CardHeader></Card>
          <Card><CardHeader><LifeBuoy className="size-6 text-primary" aria-hidden="true" /><CardTitle>Included with every ride</CardTitle><CardDescription>Safety briefing, life jacket, dock assistance, and local route guidance.</CardDescription></CardHeader></Card>
          <div className="rounded-lg border border-primary/15 bg-primary-50 p-5">
            <p className="text-sm font-semibold text-foreground">Need help choosing?</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Message our booking team on WhatsApp for a quick recommendation.</p>
            <Button asChild variant="outline" size="sm" className="mt-4"><a href="https://wa.me/971501234567"><MessageCircle data-icon aria-hidden="true" />WhatsApp us</a></Button>
          </div>
        </div>
      </section>
    </>
  );
}

export function GalleryPage() {
  return (
    <>
      <PageHero title="Life on the Dubai waterfront" text="A closer look at our fleet, marina departures, private rides, and the views that make every booking feel special." image={dubaiWaterfrontImage} compact />
      <section className="container-x py-16 sm:py-20">
        <div className="grid auto-rows-[240px] gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {galleryItems.map((item, index) => (
            <MotionReveal key={`${item.title}-${index}`} delay={index * 0.03} className={index === 0 || index === 5 ? 'sm:col-span-2' : ''}>
              <article className="group relative h-full overflow-hidden rounded-lg bg-muted">
                <Image src={item.image} alt={item.title} fill className="object-cover transition duration-500 group-hover:scale-[1.03]" sizes="(max-width: 1024px) 100vw, 66vw" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#082532]/80 to-transparent px-5 pb-5 pt-16 text-white">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-100">{item.category}</p>
                  <h2 className="mt-1 font-heading text-xl font-semibold">{item.title}</h2>
                </div>
              </article>
            </MotionReveal>
          ))}
        </div>
      </section>
      <BookingCta />
    </>
  );
}

export function ContactPage() {
  const contacts = [
    { icon: Phone, title: 'Call', text: '+971 50 123 4567', href: 'tel:+971501234567' },
    { icon: MessageCircle, title: 'WhatsApp', text: 'Chat with our booking team', href: 'https://wa.me/971501234567' },
    { icon: Mail, title: 'Email', text: 'bookings@edrivewatersports.ae', href: 'mailto:bookings@edrivewatersports.ae' },
    { icon: MapPin, title: 'Location', text: 'Dubai Marina Walk, UAE', href: 'https://maps.google.com' }
  ];
  return (
    <>
      <PageHero title="Talk to our Dubai team" text="Ask about availability, group bookings, private events, or watercraft sales. We will help you choose the right next step." image={jetCarLightImage} compact />
      <section className="container-x py-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {contacts.map((item) => (
            <a key={item.title} href={item.href} className="rounded-lg border border-border bg-white p-5 shadow-glass transition hover:-translate-y-0.5 hover:border-primary/30">
              <item.icon className="size-6 text-primary" aria-hidden="true" />
              <h2 className="mt-4 font-heading text-xl font-semibold text-foreground">{item.title}</h2>
              <p className="mt-2 break-words text-sm leading-6 text-muted-foreground">{item.text}</p>
            </a>
          ))}
        </div>
        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_0.72fr]">
          <ContactForm />
          <div className="overflow-hidden rounded-lg border border-border bg-white shadow-glass">
            <div className="relative aspect-[4/3]"><Image src={dubaiWaterfrontImage} alt="Dubai Marina service area" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 40vw" /></div>
            <div className="p-6"><h2 className="font-heading text-2xl font-semibold text-foreground">Serving the Dubai waterfront</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">Our main departure area is Dubai Marina, with arrangements available around JBR and Bluewaters depending on the booking and marine conditions.</p></div>
          </div>
        </div>
      </section>
    </>
  );
}

function HomeHero() {
  return (
    <section className="bg-white">
      <div className="container-x grid min-h-[650px] gap-10 py-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-center lg:py-14">
        <MotionReveal>
          <div className="max-w-xl">
            <h1 className="heading-luxury">Dubai,<br />from the water.</h1>
            <div className="my-6 h-px w-14 bg-gold" />
            <p className="max-w-lg text-base leading-8 text-muted-foreground sm:text-lg">Private jet ski and jet car experiences that put you at the heart of Dubai Marina. Premium craft, a professional local team, and unforgettable waterfront views.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg"><Link href="/booking"><CalendarCheck data-icon aria-hidden="true" />Book Your Ride</Link></Button>
              <Button asChild variant="outline" size="lg"><Link href="/jet-ski-rentals">Explore the Fleet <ArrowRight data-icon aria-hidden="true" /></Link></Button>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-2"><ShieldCheck className="size-4 text-primary" aria-hidden="true" />Safety equipment included</span>
              <span className="flex items-center gap-2"><MapPin className="size-4 text-primary" aria-hidden="true" />Dubai Marina</span>
            </div>
          </div>
        </MotionReveal>
        <MotionReveal delay={0.06}>
          <div className="relative aspect-[16/11] overflow-hidden rounded-lg shadow-premium">
            <Image src={dubaiWaterfrontImage} alt="Jet ski and jet car experience in Dubai Marina" fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 60vw" />
          </div>
        </MotionReveal>
      </div>
    </section>
  );
}

function ServiceOverview() {
  return (
    <section className="border-y border-border bg-background py-16 sm:py-20">
      <div className="container-x">
        <SectionIntro title="Choose your experience" text="Rent for the day, plan a private water experience, or speak with our team about owning your own craft." />
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {services.map((service, index) => (
            <MotionReveal key={service.title} delay={index * 0.04}>
              <article className="group h-full overflow-hidden rounded-lg border border-border bg-white shadow-glass">
                <div className="relative aspect-[4/3] overflow-hidden"><Image src={service.image} alt={service.title} fill className="object-cover transition duration-500 group-hover:scale-[1.03]" sizes="(max-width: 1280px) 50vw, 25vw" /></div>
                <div className="p-5"><service.icon className="size-5 text-primary" aria-hidden="true" /><h3 className="mt-4 font-heading text-xl font-semibold text-foreground">{service.title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{service.text}</p><Link href={service.href} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">View options <ArrowRight className="size-4" aria-hidden="true" /></Link></div>
              </article>
            </MotionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function MarinaExperience() {
  return (
    <section className="bg-primary-50">
      <div className="grid lg:grid-cols-2">
        <div className="flex items-center px-4 py-14 sm:px-8 lg:px-[max(2rem,calc((100vw-80rem)/2))] lg:py-20">
          <div className="max-w-xl"><Sun className="size-7 text-gold-deep" aria-hidden="true" /><h2 className="section-title mt-5">Iconic views. Unhurried moments.</h2><p className="mt-5 text-base leading-8 text-muted-foreground">Glide past Dubai Marina's skyline, luxury yachts, and open waterfront. Choose a guided route or a private pace, with local support close at hand.</p><Button asChild variant="outline" className="mt-7"><Link href="/gallery">See the experience <ArrowRight data-icon aria-hidden="true" /></Link></Button></div>
        </div>
        <div className="relative min-h-[360px] lg:min-h-[500px]"><Image src={dubaiWaterfrontImage} alt="Dubai Marina waterfront from the water" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" /></div>
      </div>
    </section>
  );
}

function TrustBand() {
  return <section className="border-y border-border bg-white"><div className="container-x grid divide-y divide-border py-8 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-5">{trustItems.map((item) => <div key={item.title} className="px-5 py-6 first:pl-0 last:pr-0"><item.icon className="size-6 text-primary" aria-hidden="true" /><h3 className="mt-4 text-sm font-semibold text-foreground">{item.title}</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">{item.text}</p></div>)}</div></section>;
}

function PageHero({ title, text, image, compact = false }: { title: string; text: string; image: string; compact?: boolean }) {
  return (
    <section className="border-b border-border bg-white">
      <div className={`container-x grid gap-8 py-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center ${compact ? 'lg:min-h-[420px]' : 'lg:min-h-[520px]'}`}>
        <MotionReveal><div className="max-w-xl"><h1 className="font-heading text-4xl font-semibold leading-tight text-foreground sm:text-5xl">{title}</h1><div className="my-5 h-px w-12 bg-gold" /><p className="text-base leading-8 text-muted-foreground">{text}</p></div></MotionReveal>
        <MotionReveal delay={0.05}><div className={`relative overflow-hidden rounded-lg shadow-premium ${compact ? 'aspect-[16/8]' : 'aspect-[16/10]'}`}><Image src={image} alt="" fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 58vw" /></div></MotionReveal>
      </div>
    </section>
  );
}

function SectionIntro({ title, text, action }: { title: string; text: string; action?: { href: string; label: string } }) {
  return (
    <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
      <div className="max-w-3xl"><h2 className="section-title">{title}</h2><p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">{text}</p></div>
      {action ? <Button asChild variant="outline"><Link href={action.href}>{action.label}<ArrowRight data-icon aria-hidden="true" /></Link></Button> : null}
    </div>
  );
}

function VehicleCard({ vehicle, sale = false }: { vehicle: (typeof vehicles)[number]; sale?: boolean }) {
  const location = vehicle.category === 'Jet Car' ? 'Dubai Marina' : 'Dubai Marina / JBR';
  return (
    <Card className="group h-full overflow-hidden">
      <div className="relative aspect-[16/10] overflow-hidden bg-muted"><Image src={vehicle.image} alt={vehicle.name} fill className="object-cover transition duration-500 group-hover:scale-[1.03]" sizes="(max-width: 1024px) 100vw, 33vw" /></div>
      <CardHeader><div className="flex items-start justify-between gap-4"><div><CardTitle>{vehicle.name}</CardTitle><CardDescription className="mt-1">{vehicle.category}</CardDescription></div><Badge variant={vehicle.status === 'Available' ? 'success' : vehicle.status === 'For Sale' ? 'gold' : vehicle.status === 'Maintenance' ? 'warning' : 'secondary'}>{vehicle.status}</Badge></div></CardHeader>
      <CardContent className="flex flex-col gap-5">
        <p className="text-sm leading-6 text-muted-foreground">{vehicle.description}</p>
        <div className="grid grid-cols-2 gap-3 border-y border-border py-4 text-sm text-muted-foreground"><span className="flex items-center gap-2"><MapPin className="size-4 text-primary" aria-hidden="true" />{location}</span><span className="flex items-center gap-2"><Users className="size-4 text-primary" aria-hidden="true" />Up to {vehicle.seats}</span></div>
        <div className="flex items-center justify-between gap-4"><p className="font-heading text-2xl font-semibold text-foreground">AED {vehicle.hourlyRate.toLocaleString()}<span className="font-sans text-xs font-normal text-muted-foreground"> {sale ? '' : '/ hour'}</span></p><Button asChild size="sm"><Link href={sale ? '/contact' : '/booking'}>{sale ? 'Inquire' : 'Book now'}<ArrowRight data-icon aria-hidden="true" /></Link></Button></div>
      </CardContent>
    </Card>
  );
}

function FleetPageContent({ items, title, text }: { items: typeof vehicles; title: string; text: string }) {
  return <section className="container-x py-16 sm:py-20"><SectionIntro title={title} text={text} action={{ href: '/booking', label: 'Reserve now' }} /><div className="mt-10 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">{items.map((vehicle, index) => <MotionReveal key={vehicle.id} delay={index * 0.04}><VehicleCard vehicle={vehicle} /></MotionReveal>)}</div></section>;
}

function IncludedSection({ type }: { type: string }) {
  return (
    <section className="border-y border-border bg-white py-16"><div className="container-x"><SectionIntro title={`Included with every ${type} booking`} text="The essentials are prepared before you arrive, so the time at the marina stays simple." /><div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">{[
      { icon: ShieldCheck, title: 'Safety briefing', text: 'Clear operating guidance before departure.' },
      { icon: LifeBuoy, title: 'Quality equipment', text: 'Life jacket and required safety gear included.' },
      { icon: Anchor, title: 'Dock assistance', text: 'Support with boarding, departure, and return.' },
      { icon: MapPin, title: 'Route guidance', text: 'Local recommendations shaped around conditions.' }
    ].map((item) => <OpenFeature key={item.title} {...item} />)}</div></div></section>
  );
}

function OpenFeature({ icon: Icon, title, text }: { icon: typeof Sparkles; title: string; text: string }) {
  return <div><Icon className="size-6 text-primary" aria-hidden="true" /><h3 className="mt-4 font-heading text-xl font-semibold text-foreground">{title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{text}</p></div>;
}

function TestimonialsSection() {
  return (
    <section className="border-y border-border bg-white py-16 sm:py-20"><div className="container-x"><SectionIntro title="What guests remember" text="A few words from recent Dubai waterfront experiences." /><div className="mt-10 grid gap-5 md:grid-cols-3">{testimonials.map((item) => <Card key={item.name} className="h-full"><CardHeader><div className="flex gap-1 text-gold-deep">{Array.from({ length: 5 }).map((_, index) => <Star key={index} className="size-4 fill-current" aria-hidden="true" />)}</div><CardDescription className="mt-3 text-base leading-7">&ldquo;{item.quote}&rdquo;</CardDescription><CardTitle className="pt-3 text-lg">{item.name}</CardTitle><p className="text-sm text-muted-foreground">{item.role}</p></CardHeader></Card>)}</div></div></section>
  );
}

function BookingCta() {
  return (
    <section className="bg-primary-50 py-14 sm:py-16"><div className="container-x flex flex-col justify-between gap-8 lg:flex-row lg:items-center"><div><h2 className="section-title">Ready for the water?</h2><p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">Choose your craft and preferred time. Our Dubai booking team will take care of the details.</p></div><div className="flex flex-col gap-3 sm:flex-row"><Button asChild size="lg"><Link href="/booking"><CalendarCheck data-icon aria-hidden="true" />Book your ride</Link></Button><Button asChild variant="outline" size="lg"><a href="https://wa.me/971501234567"><MessageCircle data-icon aria-hidden="true" />WhatsApp</a></Button></div></div></section>
  );
}
