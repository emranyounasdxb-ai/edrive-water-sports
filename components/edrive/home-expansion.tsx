import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BadgeCheck, CalendarCheck, Camera, Car, CheckCircle2, Crown, Headphones, LifeBuoy, MapPin, MessageCircle, Phone, ShieldCheck, Sparkles, Star, TicketCheck, Users, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { companyInfo, whatsappUrl } from '@/lib/company-info';
import { dubaiWaterfrontImage, fleetHeroImage, fleetShowcaseImage, jetCarLightImage, jetSkiLightImage } from '@/lib/mock-data';
import { getBookingHref, getPackagesBySlugs, publicPackages } from '@/lib/public-packages';

const featurePackages = getPackagesBySlugs([
  'golden-hour-jet-ski',
  'luxury-water-car-experience',
  'couple-luxury-water-combo',
  'family-water-sports-combo',
  'vip-marine-combo',
  'ultimate-edrive-experience'
]);

const experienceCards = [
  {
    title: 'Jet Ski Rental Dubai',
    text: 'Fast, photo-friendly rides for beginners, couples, friends, and confident riders who want Dubai water sports energy.',
    image: jetSkiLightImage,
    href: '/rentals#jet-ski-packages',
    icon: Waves
  },
  {
    title: 'Jet Car Rental Dubai',
    text: 'A luxury water-car experience made for celebrations, skyline content, birthday moments, and relaxed cruising.',
    image: jetCarLightImage,
    href: '/rentals#jet-car-packages',
    icon: Car
  }
];

const processSteps = [
  { title: 'Choose your package', text: 'Browse jet ski, jet car, combo, family, and VIP packages with clear durations.' },
  { title: 'Open booking form', text: 'Package cards take guests to booking with the selected package ready to review.' },
  { title: 'Share ride details', text: 'Guests add date, time, number of people, and any special notes for the team.' },
  { title: 'Team confirms slot', text: 'eDrive confirms availability, arrival guidance, and the best timing for the water.' }
];

const trustStats = [
  ['50', 'Static packages'],
  ['5', 'Ride categories'],
  ['24/7', 'WhatsApp inquiry'],
  ['Dubai', 'Islands Marina']
];

const faqs = [
  ['Which eDrive water sports experience is best for first-time guests?', 'For first-time guests, a 30-minute jet ski ride or a 20-minute jet car experience is a comfortable way to enjoy Dubai water sports with team guidance before the ride.'],
  ['Can I book a jet ski and jet car combo in Dubai?', 'Yes. Guests can plan a jet ski and jet car combo for friends, couples, families, birthdays, and VIP marine moments in Dubai.'],
  ['How do I choose the right package duration?', 'Choose 20 or 30 minutes for a quick Dubai marina experience, or 60 minutes when you want more cruising time, photos, and a relaxed premium ride.'],
  ['Can I contact eDrive before booking?', 'Yes. You can contact eDrive on WhatsApp or phone before booking and our team will suggest the best jet ski, jet car, or combo package for your date and group size.']
];

export function HomeExpansionSections() {
  return (
    <>
      <section className="border-y border-border bg-white/80">
        <div className="container-x grid gap-7 py-10 sm:py-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:py-14">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
              <Sparkles className="size-4" aria-hidden="true" /> Dubai water sports made premium
            </span>
            <h2 className="mt-4 font-heading text-3xl font-semibold leading-tight text-foreground sm:text-4xl">More than a ride — a complete Dubai Islands experience.</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
              eDrive brings jet ski rental Dubai, jet car rental Dubai, VIP marine moments, couple rides, and family water sports into one polished booking journey. Every section now guides guests toward packages, membership, fleet, or contact without feeling empty.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild><Link href="/rentals">Explore all packages<ArrowRight data-icon aria-hidden="true" /></Link></Button>
              <Button asChild variant="outline"><a href={whatsappUrl} target="_blank" rel="noopener noreferrer"><MessageCircle data-icon aria-hidden="true" />Ask on WhatsApp</a></Button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {trustStats.map(([value, label]) => (
              <div key={label} className="premium-surface rounded-[1.5rem] p-5">
                <p className="font-heading text-4xl font-semibold text-primary-900">{value}</p>
                <p className="mt-2 text-sm font-semibold text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f4f5f5]">
        <div className="container-x py-10 sm:py-12 lg:py-14">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Signature experiences</span>
              <h2 className="mt-2 font-heading text-3xl font-semibold text-foreground sm:text-4xl">Jet Ski and Jet Car highlights</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">Give guests a clear choice: high-energy jet ski routes, premium jet car cruises, or a combo ride that feels made for Dubai.</p>
            </div>
            <Button asChild variant="outline"><Link href="/fleet">View fleet<ArrowRight data-icon aria-hidden="true" /></Link></Button>
          </div>
          <div className="mt-7 grid gap-5 lg:grid-cols-2">
            {experienceCards.map(({ title, text, image, href, icon: Icon }) => (
              <Link key={title} href={href} className="group premium-surface premium-card-hover grid overflow-hidden rounded-[2rem] p-3 sm:grid-cols-[0.9fr_1.1fr]">
                <div className="relative min-h-[16rem] overflow-hidden rounded-[1.5rem] bg-primary-50">
                  <Image src={image} alt={title} fill className="object-cover transition duration-700 group-hover:scale-105" sizes="(max-width: 1024px) 100vw, 42vw" />
                </div>
                <div className="flex flex-col p-5">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-50 text-primary"><Icon className="size-6" aria-hidden="true" /></span>
                  <h3 className="mt-5 font-heading text-2xl font-semibold text-foreground">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{text}</p>
                  <span className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-bold text-primary">View options<ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden="true" /></span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-white/80">
        <div className="container-x py-10 sm:py-12 lg:py-14">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Recommended next</span>
              <h2 className="mt-2 font-heading text-3xl font-semibold text-foreground sm:text-4xl">Packages customers should not miss</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">A second package section gives the home page more depth and keeps users moving toward bookings.</p>
            </div>
            <Button asChild variant="outline"><Link href="/rentals">View rentals<ArrowRight data-icon aria-hidden="true" /></Link></Button>
          </div>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featurePackages.map((item) => (
              <article key={item.slug} className="premium-surface premium-card-hover flex h-full flex-col rounded-[1.6rem] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">{item.badge || item.priceLabel}</p>
                    <h3 className="mt-2 font-heading text-xl font-semibold text-foreground">{item.name}</h3>
                  </div>
                  <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary">{item.duration}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.description}</p>
                <p className="mt-3 text-xs font-semibold text-muted-foreground"><span className="text-foreground">Best for:</span> {item.bestFor}</p>
                <div className="mt-auto flex flex-col gap-2 pt-5 sm:flex-row">
                  <Button asChild size="sm" className="flex-1"><Link href={getBookingHref(item.slug)}><CalendarCheck data-icon aria-hidden="true" />Book</Link></Button>
                  <Button asChild size="sm" variant="outline" className="flex-1"><a href={`${whatsappUrl}?text=${encodeURIComponent(`Hello eDrive, I am interested in the ${item.name} package.`)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a></Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f4f5f5]">
        <div className="container-x grid gap-7 py-10 sm:py-12 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:py-14">
          <div className="relative min-h-[24rem] overflow-hidden rounded-[2rem] bg-primary-900 shadow-glass">
            <Image src={fleetHeroImage} alt="eDrive Dubai water sports booking process" fill className="object-cover opacity-86" sizes="(max-width: 1024px) 100vw, 48vw" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,23,33,0.88),rgba(4,23,33,0.12))]" />
            <div className="absolute bottom-6 left-6 max-w-sm text-white">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-300">Simple booking flow</p>
              <h2 className="mt-2 font-heading text-3xl font-semibold">Choose, book, confirm, ride.</h2>
            </div>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">How it works</span>
            <h2 className="mt-2 font-heading text-3xl font-semibold text-foreground sm:text-4xl">From package card to confirmed water time</h2>
            <div className="mt-6 grid gap-3">
              {processSteps.map((step, index) => (
                <div key={step.title} className="premium-surface flex gap-4 rounded-[1.4rem] p-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">{index + 1}</span>
                  <div>
                    <h3 className="font-heading text-lg font-semibold text-foreground">{step.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-white/80">
        <div className="container-x py-10 sm:py-12 lg:py-14">
          <div className="grid gap-5 lg:grid-cols-4">
            {[
              { icon: ShieldCheck, title: 'Safety first', text: 'Clear ride briefing, safety basics, and team guidance before departure.' },
              { icon: Camera, title: 'Photo friendly', text: 'Popular routes can be planned around skyline, marina, and sunset moments.' },
              { icon: Users, title: 'Groups welcome', text: 'Family, friends, birthday, and corporate packages keep planning simple.' },
              { icon: Headphones, title: 'Local support', text: 'WhatsApp, phone, and email support help guests choose the right package.' }
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="premium-surface rounded-[1.6rem] p-5">
                <Icon className="size-7 text-primary" aria-hidden="true" />
                <h3 className="mt-4 font-heading text-xl font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f4f5f5]">
        <div className="container-x grid gap-5 py-10 sm:py-12 lg:grid-cols-[0.95fr_1.05fr] lg:py-14">
          <div className="premium-dark rounded-[2rem] p-6 text-white sm:p-8">
            <Crown className="size-9 text-accent-300" aria-hidden="true" />
            <h2 className="mt-5 font-heading text-3xl font-semibold text-white sm:text-4xl">Membership for repeat riders and VIP guests</h2>
            <p className="mt-4 text-sm leading-7 text-white/70">Explorer, Premium, and VIP Marine membership options help customers ask for better support, recurring ride planning, birthday offers, and private marine moments.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild variant="gold"><Link href="/membership">Explore membership<ArrowRight data-icon aria-hidden="true" /></Link></Button>
              <Button asChild variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white hover:text-primary-900"><Link href="/contact">Request call back</Link></Button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['Explorer', 'Tourists and first-time guests'],
              ['Premium', 'Dubai residents and repeat riders'],
              ['VIP Marine', 'Private groups and sunset bookings'],
              ['Sales Inquiry', 'Try before buying a jet ski or jet car']
            ].map(([title, text]) => (
              <div key={title} className="premium-surface rounded-[1.6rem] p-5">
                <Star className="size-6 text-primary" aria-hidden="true" />
                <h3 className="mt-4 font-heading text-xl font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-white/80">
        <div className="container-x grid gap-7 py-10 sm:py-12 lg:grid-cols-[0.8fr_1.2fr] lg:py-14">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Dubai ride questions</span>
            <h2 className="mt-2 font-heading text-3xl font-semibold text-foreground sm:text-4xl">Dubai Water Sports FAQ</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">Everything guests need to know before booking a jet ski, jet car, combo, or VIP water sports experience in Dubai.</p>
          </div>
          <div className="grid gap-3">
            {faqs.map(([question, answer]) => (
              <details key={question} className="premium-surface rounded-[1.25rem] p-4 open:border-primary/25">
                <summary className="cursor-pointer font-heading text-lg font-semibold text-foreground">{question}</summary>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f4f5f5] pb-10 sm:pb-12 lg:pb-14">
        <div className="container-x">
          <div className="premium-dark grid gap-5 rounded-[2rem] p-6 text-white sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-300">Need help choosing?</p>
              <h2 className="mt-2 font-heading text-3xl font-semibold text-white sm:text-4xl">Talk to eDrive before you book.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">Tell us your date, number of guests, and whether you prefer jet ski, jet car, combo, family, VIP, or sales inquiry support.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Button asChild variant="gold"><a href={whatsappUrl} target="_blank" rel="noopener noreferrer"><MessageCircle data-icon aria-hidden="true" />WhatsApp eDrive</a></Button>
              <Button asChild variant="outline" className="border-white/20 bg-white text-primary-900 hover:bg-primary-50"><a href={`tel:${companyInfo.landlineHref}`}><Phone data-icon aria-hidden="true" />Call now</a></Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
