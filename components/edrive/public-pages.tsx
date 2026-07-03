import Image from 'next/image';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  Anchor,
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  Camera,
  Car,
  CheckCircle2,
  Clock,
  Compass,
  Crown,
  Headphones,
  LifeBuoy,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Sailboat,
  ShieldCheck,
  Ship,
  Sparkles,
  Star,
  Sun,
  TicketCheck,
  Users,
  Waves
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { companyInfo, whatsappUrl } from '@/lib/company-info';
import {
  dubaiWaterfrontImage,
  fleetHeroImage,
  jetCarLightImage,
  jetSkiLightImage
} from '@/lib/mock-data';
import {
  featuredPackageSlugs,
  getBookingHref,
  getPackagesByCategory,
  getPackagesBySlugs,
  packageCategoryDescriptions,
  packageCategoryLabels,
  popularPackageSlugs,
  publicPackageCategories,
  publicPackages,
  type PublicPackage,
  type PublicPackageCategory
} from '@/lib/public-packages';
import { cn } from '@/lib/utils';
import { BookingForm } from './booking-form';
import { ContactForm } from './contact-form';
import { MotionReveal } from './motion-reveal';

const sectionPad = 'py-10 sm:py-12 lg:py-14';
const featuredPackages = getPackagesBySlugs(featuredPackageSlugs);
const popularPackages = getPackagesBySlugs(popularPackageSlugs);

const categoryIcons: Record<PublicPackageCategory, LucideIcon> = {
  'jet-ski': Waves,
  'jet-car': Car,
  combo: Sailboat,
  family: Users,
  vip: Crown
};

const categoryVisualClasses: Record<PublicPackageCategory, string> = {
  'jet-ski': 'from-primary-900 via-primary-700 to-primary-500 text-white',
  'jet-car': 'from-primary-900 via-ink-deep to-accent-600 text-white',
  combo: 'from-primary-600 via-primary-100 to-accent-500 text-primary-900',
  family: 'from-white via-primary-50 to-primary-100 text-primary-900',
  vip: 'from-ink-deep via-primary-900 to-accent-700 text-accent-100'
};

const homeLinks = [
  { href: '/rentals', label: 'Rentals', text: 'Jet ski, jet car, combo, family, and VIP packages.' },
  { href: '/fleet', label: 'Fleet', text: 'Explore premium ride types and beginner-friendly options.' },
  { href: '/membership', label: 'Membership', text: 'Member-only support for frequent riders and VIP guests.' },
  { href: '/contact', label: 'Contact', text: 'Talk to the eDrive Dubai Islands team.' }
];

const whyChoose = [
  { icon: MapPin, title: 'Dubai Islands Location', text: 'Start from Dubai Island Marina with easy arrival guidance and a premium waterfront setting.' },
  { icon: Sparkles, title: 'Premium Fleet', text: 'Jet skis and jet cars prepared for polished rides, photos, and confident handovers.' },
  { icon: Compass, title: 'Guided Experiences', text: 'Helpful team support for routes, timing, safety, and the right package choice.' },
  { icon: CalendarCheck, title: 'Easy Booking', text: 'Choose a package, share your preferred date, and let the team confirm availability.' },
  { icon: Users, title: 'Family and Couple Friendly', text: 'Options for first-time riders, couples, families, groups, and VIP marine days.' },
  { icon: MessageCircle, title: 'WhatsApp Support', text: 'Quick help for booking questions, directions, package notes, and final details.' }
];

const safetyItems = [
  { icon: ShieldCheck, title: 'Safety Briefing', text: 'Every ride starts with clear guidance and team instructions.' },
  { icon: LifeBuoy, title: 'Safety Equipment', text: 'Life jackets and required safety basics are prepared before departure.' },
  { icon: Anchor, title: 'Dock Support', text: 'Arrival, boarding, route notes, and return support stay simple.' },
  { icon: Headphones, title: 'Local Team', text: 'The eDrive team stays reachable by phone and WhatsApp.' }
];

const fleetCards = [
  { icon: Waves, type: 'Premium Jet Ski', capacity: '1-2 guests', bestFor: 'Jet ski rental Dubai rides, skyline photos, and guided coast routes.', image: jetSkiLightImage },
  { icon: Car, type: 'Luxury Jet Car', capacity: '1-2 guests', bestFor: 'Jet car rental Dubai cruises, birthdays, content, and statement arrivals.', image: jetCarLightImage },
  { icon: LifeBuoy, type: 'Beginner Friendly Ride', capacity: '1-2 guests', bestFor: 'First-time riders who want clear guidance and a steady pace.', image: jetSkiLightImage },
  { icon: Crown, type: 'VIP Experience Ride', capacity: 'Private timing', bestFor: 'Premium sunset slots, private support, and tailored marine planning.', image: dubaiWaterfrontImage },
  { icon: Users, type: 'Family / Group Friendly Option', capacity: 'Custom group support', bestFor: 'Families, friends, birthdays, and corporate water sports days.', image: fleetHeroImage }
];

const membershipTiers = [
  {
    name: 'Explorer Member',
    bestFor: 'Tourists, occasional riders, first-time customers',
    cta: 'Apply for Explorer Membership',
    tone: 'light',
    benefits: ['Member-only offers', 'Priority WhatsApp support', 'Birthday discount', 'Early access to seasonal deals', 'Basic ride recommendations']
  },
  {
    name: 'Premium Member',
    bestFor: 'Dubai residents, repeat riders, couples, small groups',
    cta: 'Request Premium Membership',
    tone: 'gold',
    benefits: ['Better rental rates', 'Priority booking slots', 'Weekday special rates', 'Free upgrade offers when available', 'Friends/family add-on discount', 'Membership-only package suggestions']
  },
  {
    name: 'VIP Marine Member',
    bestFor: 'VIP customers, frequent users, private group bookings, luxury clients',
    cta: 'Apply for VIP Membership',
    tone: 'dark',
    benefits: ['VIP booking support', 'Priority sunset slots', 'Custom ride planning', 'Premium jet car/jet ski access', 'Private group experiences', 'Dedicated support', 'Photo/video add-on priority']
  }
];

export function HomePage() {
  return (
    <>
      <PublicHero
        title="Premium Jet Ski & Jet Car Experiences in Dubai"
        text="Ride across Dubai's most beautiful waters with eDrive Water Sports. Choose from premium jet ski rides, luxury jet car experiences, combo packages, and exclusive member offers."
        image={dubaiWaterfrontImage}
        imageAlt="Premium jet ski and jet car experiences at Dubai Islands Marina"
        actions={[
          { href: '/rentals', label: 'Explore Rentals', icon: Waves },
          { href: '/fleet', label: 'View Fleet', icon: Ship, variant: 'outline' },
          { href: whatsappUrl, label: 'WhatsApp Us', icon: MessageCircle, variant: 'gold', external: true }
        ]}
      />

      <section id="popular-packages" className={cn('container-x', sectionPad)}>
        <SectionHeader
          title="Popular Dubai Water Sports Packages"
          text="Start with the most requested jet ski, jet car, family, combo, and VIP packages from our curated public package collection."
          action={{ href: '/rentals', label: 'View All 50 Packages' }}
        />
        <PackageGrid packages={featuredPackages} className="mt-7 lg:grid-cols-4" />
      </section>

      <section className="border-y border-border bg-white/70">
        <div className={cn('container-x', sectionPad)}>
          <SectionHeader title="Fleet Preview" text="Choose a powerful jet ski or a head-turning jet car, then book from the package that fits your ride style." />
          <div className="mt-7 grid gap-5 md:grid-cols-2">
            <FleetPreviewCard title="Premium Jet Ski Rides" text="Responsive jet skis for first-time riders, skyline photo routes, and longer Dubai coastline tours." image={jetSkiLightImage} href="/fleet" cta="View Fleet" icon={Waves} />
            <FleetPreviewCard title="Luxury Jet Car Cruises" text="A supercar-on-water feeling for couples, birthdays, VIP guests, and content-friendly marine moments." image={jetCarLightImage} href="/rentals" cta="View Rental Packages" icon={Car} />
          </div>
        </div>
      </section>

      <section className={cn('container-x', sectionPad)}>
        <SectionHeader title="Why Choose eDrive" text="Premium support, clean ride planning, and a Dubai Islands location make every public booking feel easy from the first click." />
        <FeatureGrid items={whyChoose} className="mt-7 lg:grid-cols-3" />
      </section>

      <section className="bg-primary-900 text-white">
        <div className="container-x grid gap-6 py-10 lg:grid-cols-2 lg:py-14">
          <ExperienceSplit title="Jet Ski Energy" text="Fast, guided, and photo-friendly jet ski Dubai Islands packages for riders who want movement, sea spray, and skyline views." image={jetSkiLightImage} href="/rentals#jet-ski-packages" cta="Jet Ski Packages" icon={Waves} />
          <ExperienceSplit title="Jet Car Luxury" text="A premium jet car Dubai experience for couples, celebrations, and guests who want something unmistakably different." image={jetCarLightImage} href="/rentals#jet-car-packages" cta="Jet Car Packages" icon={Car} />
        </div>
      </section>

      <section className={cn('container-x grid gap-7 lg:grid-cols-[0.9fr_1.1fr] lg:items-center', sectionPad)}>
        <div>
          <h2 className="section-title">Membership Benefits for Frequent Riders</h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">eDrive membership is built for Dubai residents, repeat riders, couples, families, and VIP guests who want priority support and better package recommendations.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild><Link href="/membership"><Crown data-icon aria-hidden="true" />Join Membership</Link></Button>
            <Button asChild variant="outline"><Link href="/membership#member-benefits">View Member Benefits</Link></Button>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {membershipTiers.map((tier) => <TierMiniCard key={tier.name} tier={tier} />)}
        </div>
      </section>

      <section className="border-y border-border bg-white/70">
        <div className={cn('container-x', sectionPad)}>
          <SectionHeader title="Recommended Experiences" text="Not sure where to start? These package groups cover the most common Dubai water sports plans." />
          <RelatedLinks links={[
            { href: '/rentals#jet-ski-packages', label: 'Jet Ski Packages', text: packageCategoryDescriptions['jet-ski'] },
            { href: '/rentals#jet-car-packages', label: 'Jet Car Packages', text: packageCategoryDescriptions['jet-car'] },
            { href: '/rentals#vip-packages', label: 'VIP Packages', text: packageCategoryDescriptions.vip },
            { href: '/rentals#family-packages', label: 'Family Packages', text: packageCategoryDescriptions.family }
          ]} />
        </div>
      </section>

      <section className={cn('container-x', sectionPad)}>
        <SectionHeader title="Safety, Support, and Trust" text="The eDrive team keeps the public booking flow simple while making the ride experience feel polished and well prepared." />
        <FeatureGrid items={safetyItems} className="mt-7 lg:grid-cols-4" />
      </section>

      <LocationHighlight />
      <FinalCta title="Ready to choose your Dubai water sports package?" text="Explore the full rentals page, choose a static marketing package, and send your preferred date, time, guests, and notes." />
    </>
  );
}

export function FleetPage() {
  return (
    <>
      <PublicHero
        title="Explore Our Premium Water Sports Fleet"
        text="Choose from powerful jet skis and luxury jet cars designed for unforgettable rides across Dubai's coastline, with guided support for beginners, couples, families, and VIP guests."
        image={fleetHeroImage}
        imageAlt="Premium eDrive jet ski and jet car fleet in Dubai"
        actions={[
          { href: '/rentals', label: 'View Rental Packages', icon: TicketCheck },
          { href: '/membership', label: 'Join Membership', icon: Crown, variant: 'outline' },
          { href: '/contact', label: 'Contact eDrive', icon: MessageCircle, variant: 'gold' }
        ]}
      />

      <section className={cn('container-x', sectionPad)}>
        <SectionHeader title="Jet Ski Fleet Cards" text="Premium jet ski options for Dubai Islands water sports, beginner rides, skyline tours, and longer coast sessions." />
        <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {fleetCards.filter((card) => card.type.includes('Jet Ski') || card.type.includes('Beginner')).map((card) => <FleetCard key={card.type} {...card} />)}
        </div>
      </section>

      <section className="border-y border-border bg-white/70">
        <div className={cn('container-x', sectionPad)}>
          <SectionHeader title="Jet Car Fleet Cards" text="Luxury jet car options for photo sessions, birthday rides, marina views, and VIP marine experiences." />
          <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {fleetCards.filter((card) => card.type.includes('Jet Car') || card.type.includes('VIP') || card.type.includes('Family')).map((card) => <FleetCard key={card.type} {...card} />)}
          </div>
        </div>
      </section>

      <section className={cn('container-x', sectionPad)}>
        <SectionHeader title="Fleet Features" text="Every ride type is presented with the essentials customers expect before booking in Dubai." />
        <FeatureGrid items={[
          { icon: CheckCircle2, title: 'Well-maintained rides', text: 'Craft are prepared before departures with a polished marina handover.' },
          { icon: Headphones, title: 'Guided support', text: 'Helpful route guidance and guest support for first-time and returning riders.' },
          { icon: Camera, title: 'Photo-friendly routes', text: 'Packages can be timed around skyline, marina, and sunset photo moments.' },
          { icon: Clock, title: 'Flexible durations', text: 'Choose 30, 60, 90, 120 minute, group, or custom VIP timing.' },
          { icon: MapPin, title: 'Dubai Islands pickup', text: `Plan around ${companyInfo.locationName} with clear arrival details.` }
        ]} className="mt-7 lg:grid-cols-5" />
      </section>

      <section className="border-y border-border bg-white/70">
        <div className={cn('container-x', sectionPad)}>
          <SectionHeader title="Safety & Maintenance" text="The fleet page is public marketing only, but the customer promise stays practical: prepared rides, briefing, safety equipment, and clear team instructions." />
          <FeatureGrid items={safetyItems} className="mt-7 lg:grid-cols-4" />
        </div>
      </section>

      <section className={cn('container-x', sectionPad)}>
        <SectionHeader title="Recommended Rental Packages" text="Fleet browsing should lead naturally to package choice, with booking triggered from cards and CTAs." action={{ href: '/rentals', label: 'Explore Rentals' }} />
        <PackageGrid packages={popularPackages.slice(0, 6)} className="mt-7" />
      </section>

      <FAQSection
        title="Fleet FAQ"
        items={[
          ['Do I need experience to ride a jet ski?', 'No. Beginners can book beginner-friendly jet ski packages with safety briefing and team guidance.'],
          ['Can beginners book?', 'Yes. The fleet includes options suitable for first-time riders, couples, and guests who prefer a calmer pace.'],
          ['Are jet cars available for photos?', 'Yes. Jet car packages are especially popular for birthdays, couples, and premium photo-friendly rides.'],
          ['How do I book?', 'Choose a package from Rentals or any package card, then submit the public booking form with your preferred date and time.']
        ]}
      />

      <RelatedBand links={[
        { href: '/rentals', label: 'Explore Rentals' },
        { href: '/membership', label: 'Join Membership' },
        { href: '/contact', label: 'Contact eDrive' },
        { href: '/sales', label: 'Sales Inquiry' }
      ]} />
    </>
  );
}

export function SalesPage() {
  return (
    <>
      <PublicHero
        title="Jet Ski & Jet Car Sales in Dubai"
        text="Looking to buy a jet ski or jet car? eDrive helps customers explore available units, compare options, and request current inventory based on their budget and usage needs."
        image={dubaiWaterfrontImage}
        imageAlt="Dubai marine sales inquiry support"
        actions={[
          { href: '/contact', label: 'Request Sales Availability', icon: Mail },
          { href: whatsappUrl, label: 'Talk to Sales Team', icon: MessageCircle, variant: 'gold', external: true },
          { href: '/fleet', label: 'View Rental Fleet First', icon: Ship, variant: 'outline' }
        ]}
      />

      <section className={cn('container-x grid gap-5 lg:grid-cols-2', sectionPad)}>
        <SalesInquiryCard icon={Waves} title="Jet Ski Sales Inquiry" text="Tell us if you are looking for new or pre-owned jet skis, private use, commercial use, preferred budget, and delivery timing." />
        <SalesInquiryCard icon={Car} title="Jet Car Sales Inquiry" text="Request current jet car availability, viewing options, specifications, and next steps for private or business ownership." />
      </section>

      <section className="border-y border-border bg-white/70">
        <div className={cn('container-x', sectionPad)}>
          <SectionHeader title="Why Buy Through eDrive" text="Sales content stays inquiry-based so customers can request real availability instead of relying on fake inventory." />
          <FeatureGrid items={[
            { icon: BadgeCheck, title: 'Availability Based', text: 'Request current options rather than browsing outdated or fictional stock.' },
            { icon: Headphones, title: 'Clear Advice', text: 'Share your budget, usage needs, and preferred ride type for practical guidance.' },
            { icon: ShieldCheck, title: 'Inspection Mindset', text: 'Ask about condition, viewing, ownership support, and handover details.' }
          ]} className="mt-7 md:grid-cols-3" />
        </div>
      </section>

      <section className={cn('container-x grid gap-5 lg:grid-cols-2', sectionPad)}>
        <InfoPanel title="New Unit Inquiry" text="Ask the sales team about current or upcoming new jet ski and jet car availability, specification options, and recommended models for Dubai waters." cta="Request Current Availability" href="/contact" icon={Sparkles} />
        <InfoPanel title="Pre-Owned Inquiry" text="Tell us if you prefer a maintained pre-owned unit, approximate budget, intended use, and whether you would like to inspect before deciding." cta="Talk to Sales Team" href={whatsappUrl} icon={TicketCheck} external />
      </section>

      <TimelineSection
        title="Sales Process"
        steps={['Send inquiry', 'Share requirements', 'Receive available options', 'Inspect / confirm', 'Final offer and next steps']}
      />

      <section className={cn('container-x', sectionPad)}>
        <div className="premium-surface grid gap-6 rounded-[2rem] bg-primary-900 p-6 text-white sm:p-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <h2 className="font-heading text-3xl font-semibold leading-tight text-white">Try Before You Buy</h2>
            <p className="mt-3 text-sm leading-7 text-white/72">Many customers prefer to ride first. Explore jet ski rental Dubai packages and luxury jet car rental Dubai options before making a sales inquiry.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
            <Button asChild variant="gold"><Link href="/rentals">Explore Rentals<ArrowRight data-icon aria-hidden="true" /></Link></Button>
            <Button asChild variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white hover:text-primary-900"><Link href="/fleet">View Fleet</Link></Button>
          </div>
        </div>
      </section>

      <FAQSection
        title="Sales FAQ"
        items={[
          ['Do you sell new or pre-owned units?', 'Sales inquiries can cover both new and pre-owned jet skis or jet cars, depending on current availability.'],
          ['Can I request current availability?', 'Yes. Use Contact or WhatsApp to share your requirements and request the latest available options.'],
          ['Can I rent before buying?', 'Yes. The Rentals and Fleet pages help customers experience ride styles before a sales decision.'],
          ['How do I contact the sales team?', 'Use the sales CTAs, Contact page, phone, email, or WhatsApp to start an inquiry.']
        ]}
      />

      <RelatedBand links={[
        { href: '/fleet', label: 'View Fleet' },
        { href: '/rentals', label: 'Explore Rentals' },
        { href: '/contact', label: 'Contact eDrive' }
      ]} />
    </>
  );
}

export function RentalsPage() {
  return (
    <>
      <PublicHero
        title="Jet Ski & Jet Car Rental Packages in Dubai"
        text="Choose from exciting jet ski rides, luxury jet car cruises, couple experiences, family packages, and VIP water sports adventures with eDrive Water Sports."
        image={jetSkiLightImage}
        imageAlt="Jet ski and jet car rental packages in Dubai"
        actions={[
          { href: '#popular-packages', label: 'View Popular Packages', icon: Star },
          { href: '/membership', label: 'Join Membership', icon: Crown, variant: 'outline' },
          { href: whatsappUrl, label: 'WhatsApp Us', icon: MessageCircle, variant: 'gold', external: true }
        ]}
      />

      <section className={cn('container-x', sectionPad)}>
        <SectionHeader title="Choose a Package Category" text={`All ${publicPackages.length} packages are grouped for easy browsing across jet ski, jet car, combo, family, and VIP experiences.`} />
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <CategoryAnchor href="#popular-packages" label="Most Popular" count={popularPackages.length} icon={Star} />
          {publicPackageCategories.map((category) => (
            <CategoryAnchor key={category} href={`#${categorySectionId(category)}`} label={packageCategoryLabels[category]} count={getPackagesByCategory(category).length} icon={categoryIcons[category]} />
          ))}
        </div>
      </section>

      <section id="popular-packages" className="border-y border-border bg-white/70">
        <div className={cn('container-x', sectionPad)}>
          <SectionHeader title="Most Popular Packages" text="These are the most requested eDrive packages for visitors, residents, couples, families, and VIP Dubai marine experiences." />
          <PackageGrid packages={popularPackages} className="mt-7 lg:grid-cols-4" />
        </div>
      </section>

      {publicPackageCategories.map((category) => (
        <section key={category} id={categorySectionId(category)} className={cn('container-x scroll-mt-28', sectionPad)}>
          <SectionHeader title={categoryHeading(category)} text={packageCategoryDescriptions[category]} />
          <PackageGrid packages={getPackagesByCategory(category)} className="mt-7 lg:grid-cols-3" />
          <div className="mt-7 rounded-[1.5rem] border border-primary/15 bg-primary-50 px-5 py-4 text-sm leading-6 text-primary-900 sm:flex sm:items-center sm:justify-between sm:gap-4">
            <span>Not sure which package to choose? Contact us on WhatsApp and share your preferred date, guests, and ride style.</span>
            <Button asChild size="sm" className="mt-3 sm:mt-0"><a href={whatsappUrl} target="_blank" rel="noopener noreferrer"><MessageCircle data-icon aria-hidden="true" />Ask on WhatsApp</a></Button>
          </div>
        </section>
      ))}

      <TimelineSection
        title="How Booking Works"
        steps={['Choose a package', 'Open booking form', 'Share date, time, guests, and notes', 'eDrive team confirms availability']}
      />

      <section className="border-y border-border bg-white/70">
        <div className={cn('container-x', sectionPad)}>
          <SectionHeader title="Safety & Requirements" text="Keep your rental simple: follow the team instructions, bring required ID if requested, and let us know your guest count early." />
          <FeatureGrid items={[
            { icon: Headphones, title: 'Guided support', text: 'The team helps with route notes, dock handling, and ride timing.' },
            { icon: ShieldCheck, title: 'Safety briefing', text: 'Guests receive clear safety guidance before heading out.' },
            { icon: BadgeCheck, title: 'Suitable for beginners', text: 'Beginner-friendly jet ski and guided ride options are available.' },
            { icon: TicketCheck, title: 'Bring ID if required', text: 'Our team will confirm any required documents before your ride.' },
            { icon: CheckCircle2, title: 'Follow instructions', text: 'Marine conditions and team guidance always shape the final ride plan.' }
          ]} className="mt-7 lg:grid-cols-5" />
        </div>
      </section>

      <section className={cn('container-x', sectionPad)}>
        <InfoPanel title="Frequent rider or Dubai resident?" text="Membership can unlock priority booking support, weekday suggestions, member-only package recommendations, and VIP planning for repeat customers." cta="Join Membership" href="/membership" icon={Crown} />
      </section>

      <FAQSection
        title="Rental Package FAQ"
        items={[
          ['How do I book a package?', 'Click Book This Package on any package card. The booking page opens with the package slug in the URL and the selected package visible in the form.'],
          ['Can I choose the ride duration?', 'Yes. Many packages use standard 30, 60, 90, or 120 minute durations, while group and VIP packages can use custom timing.'],
          ['Can couples book together?', 'Yes. Couple jet ski, jet car, combo, and VIP marine packages are included.'],
          ['Are packages fixed or customizable?', 'Published packages help you choose quickly, and the team can confirm availability, timing, and suitable adjustments by WhatsApp.'],
          ['Can I contact by WhatsApp?', `Yes. Use any WhatsApp CTA or message ${companyInfo.whatsappDisplay}.`]
        ]}
      />

      <RelatedBand links={[
        { href: '/fleet', label: 'Explore Fleet' },
        { href: '/membership', label: 'Join Membership' },
        { href: '/contact', label: 'Contact eDrive' },
        { href: '/sales', label: 'Sales Inquiry' }
      ]} />

      <FinalCta title="Choose your Dubai Islands water sports package" text="Pick one of the 50 public packages, open the booking form, and share the details your eDrive team needs to confirm availability." />
    </>
  );
}

export function MembershipPage() {
  return (
    <>
      <PublicHero
        title="eDrive Water Sports Membership"
        text="Enjoy member-only rental benefits, priority booking support, special offers, and premium water sports experiences designed for frequent riders, Dubai residents, couples, families, and VIP guests."
        image={dubaiWaterfrontImage}
        imageAlt="eDrive Water Sports membership in Dubai"
        actions={[
          { href: '/contact', label: 'Apply for Membership', icon: Crown },
          { href: '/rentals', label: 'View Rental Packages', icon: TicketCheck, variant: 'outline' },
          { href: whatsappUrl, label: 'WhatsApp Membership Team', icon: MessageCircle, variant: 'gold', external: true }
        ]}
      />

      <section className={cn('container-x', sectionPad)}>
        <SectionHeader title="Why Join eDrive Membership" text="Membership is request-based, built for guests who want better guidance, smoother repeat bookings, and elevated Dubai marine experiences." />
        <FeatureGrid items={[
          { icon: CalendarCheck, title: 'Priority Booking Support', text: 'Get faster help with date, time, package, and slot planning.' },
          { icon: TicketCheck, title: 'Member Offers', text: 'Ask about seasonal, weekday, birthday, and repeat-rider opportunities.' },
          { icon: Crown, title: 'VIP Planning', text: 'Private groups and premium customers can request elevated ride planning.' }
        ]} className="mt-7 md:grid-cols-3" />
      </section>

      <section id="member-benefits" className="border-y border-border bg-white/70">
        <div className={cn('container-x', sectionPad)}>
          <SectionHeader title="Membership Tiers" text="Choose the lead tier that best matches your ride style. No payment integration is required on the public website." />
          <div className="mt-7 grid gap-5 lg:grid-cols-3">
            {membershipTiers.map((tier) => <MembershipTierCard key={tier.name} tier={tier} />)}
          </div>
        </div>
      </section>

      <section className={cn('container-x', sectionPad)}>
        <SectionHeader title="Member Benefits Comparison" text="A simple view of how each tier supports repeat customers, residents, families, and VIP marine bookings." />
        <div className="mt-7 overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/78 shadow-glass">
          <div className="grid min-w-[760px] grid-cols-4 border-b border-border bg-primary-900 text-white">
            {['Benefit', 'Explorer', 'Premium', 'VIP Marine'].map((item) => <div key={item} className="px-5 py-4 text-sm font-semibold">{item}</div>)}
          </div>
          {[
            ['Priority WhatsApp support', 'Yes', 'Higher priority', 'Dedicated support'],
            ['Member-only offers', 'Seasonal', 'Better rental rates', 'Custom VIP planning'],
            ['Best for', 'Tourists', 'Residents and repeat riders', 'Private and VIP groups'],
            ['Ride planning', 'Basic suggestions', 'Package recommendations', 'Custom ride planning']
          ].map((row) => (
            <div key={row[0]} className="grid min-w-[760px] grid-cols-4 border-b border-border/70 last:border-b-0">
              {row.map((cell, index) => <div key={`${row[0]}-${cell}`} className={cn('px-5 py-4 text-sm', index === 0 ? 'font-semibold text-foreground' : 'text-muted-foreground')}>{cell}</div>)}
            </div>
          ))}
        </div>
      </section>

      <TimelineSection
        title="How to Apply"
        steps={['Choose membership tier', 'Send inquiry', 'Team confirms eligibility and offers', 'Enjoy member benefits']}
      />

      <section className={cn('container-x', sectionPad)}>
        <SectionHeader title="Best Packages for Members" text="Members often start with popular, VIP, couple, and combo packages before asking for custom timing or recurring support." action={{ href: '/rentals', label: 'Explore Rentals' }} />
        <PackageGrid packages={popularPackages.slice(0, 6)} className="mt-7" />
      </section>

      <FAQSection
        title="Membership FAQ"
        items={[
          ['Is membership paid?', 'Membership is handled as a lead request. The eDrive team will confirm current eligibility, benefits, and any offer details directly.'],
          ['Can tourists join?', 'Yes. Explorer membership is suitable for tourists and occasional riders who want better support and offers.'],
          ['What benefits do members get?', 'Benefits may include member-only offers, priority support, weekday suggestions, birthday discounts, and VIP planning.'],
          ['How do I apply?', 'Choose a tier and contact eDrive through the membership CTAs, Contact page, or WhatsApp.'],
          ['Can families use membership?', 'Yes. Premium and VIP Marine tiers are especially useful for families, groups, and recurring bookings.']
        ]}
      />

      <RelatedBand links={[
        { href: '/rentals', label: 'Explore Rentals' },
        { href: '/fleet', label: 'View Fleet' },
        { href: '/contact', label: 'Contact eDrive' }
      ]} />
    </>
  );
}

export function BookingPage() {
  return (
    <>
      <section className="container-x pt-8 text-center sm:pt-10">
        <h1 className="mx-auto max-w-3xl font-heading text-4xl font-semibold leading-tight text-foreground sm:text-5xl">Plan your time on the water</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">Share your preferred date, time, guests, and ride notes. If you arrived from a package card, your selected package will appear in the form after the page loads.</p>
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
        text={`Visit eDrive Water Sports at ${companyInfo.locationName} or contact our team to book your jet ski, jet car, sales inquiry, or membership request.`}
        image={jetCarLightImage}
        imageAlt="Contact eDrive Water Sports Dubai"
        actions={[
          { href: whatsappUrl, label: 'WhatsApp Us', icon: MessageCircle, external: true },
          { href: `tel:${companyInfo.landlineHref}`, label: 'Call Now', icon: Phone, variant: 'outline', external: true },
          { href: companyInfo.mapLink, label: 'Get Directions', icon: MapPin, variant: 'gold', external: true },
          { href: '/rentals', label: 'Book a Ride', icon: CalendarCheck, variant: 'outline' }
        ]}
      />

      <section className={cn('container-x', sectionPad)}>
        <SectionHeader title="Quick Contact" text="Reach the eDrive team for jet ski rental Dubai bookings, jet car rental Dubai inquiries, membership requests, and sales availability." />
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
          <div>
            <SectionHeader title="WhatsApp, Phone, Email, and Location" text="Use the channel that fits your plan. WhatsApp is best for fast package questions, arrival details, and availability checks." />
            <div className="mt-6 grid gap-3">
              <ContactLine icon={MessageCircle} label="WhatsApp" value={companyInfo.whatsappDisplay} href={whatsappUrl} external />
              <ContactLine icon={Phone} label="Phone" value={companyInfo.landlineDisplay} href={`tel:${companyInfo.landlineHref}`} />
              <ContactLine icon={Mail} label="Email" value={companyInfo.bookingEmail} href={`mailto:${companyInfo.bookingEmail}`} />
              <ContactLine icon={MapPin} label="Location" value={companyInfo.locationAddress} href={companyInfo.mapLink} external />
            </div>
            <div className="mt-6 rounded-[1.5rem] border border-primary/15 bg-primary-50 p-5">
              <h3 className="font-heading text-xl font-semibold text-foreground">Business Hours</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Contact the team for today's ride availability and weather-aware scheduling. Preferred slots are confirmed directly by the eDrive team.</p>
            </div>
          </div>
          <Card id="map" className="overflow-hidden p-3">
            <div className="overflow-hidden rounded-[1.5rem]">
              <iframe
                src={companyInfo.mapEmbedSrc}
                width="100%"
                height="430"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                title="eDrive Water Sports location map"
                className="block w-full"
              />
            </div>
            <CardContent className="p-5">
              <h2 className="font-heading text-2xl font-semibold text-foreground">{companyInfo.locationName}</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">Use the map for directions to our main Dubai Islands Marina location. For bookings and arrival instructions, contact our team before your ride.</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className={cn('container-x grid gap-7 lg:grid-cols-[1fr_0.8fr]', sectionPad)}>
        <ContactForm />
        <div className="premium-surface rounded-[2rem] p-6">
          <h2 className="font-heading text-2xl font-semibold text-foreground">Recommended Pages</h2>
          <RelatedLinks links={[
            { href: '/rentals', label: 'Explore Rentals', text: 'Browse all 50 static jet ski, jet car, combo, family, and VIP packages.' },
            { href: '/fleet', label: 'View Fleet', text: 'See premium ride types before choosing your package.' },
            { href: '/membership', label: 'Join Membership', text: 'Ask about member-only support and frequent-rider benefits.' },
            { href: '/sales', label: 'Sales Inquiry', text: 'Request current jet ski and jet car sales availability.' }
          ]} compact />
        </div>
      </section>

      <FAQSection
        title="Contact FAQ"
        items={[
          ['Where is eDrive located?', `eDrive Water Sports is based at ${companyInfo.locationName}, ${companyInfo.locationAddress}.`],
          ['Can I book through WhatsApp?', 'Yes. WhatsApp is available for package questions, availability checks, and booking support.'],
          ['Do you offer jet ski and jet car packages?', 'Yes. The Rentals page includes jet ski, jet car, combo, family, and VIP water sports packages.'],
          ['Can I ask about membership?', 'Yes. Contact the team for Explorer, Premium, or VIP Marine membership requests.']
        ]}
      />

      <RelatedBand links={[
        { href: '/rentals', label: 'Explore Rentals' },
        { href: '/fleet', label: 'View Fleet' },
        { href: '/membership', label: 'Join Membership' }
      ]} />
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
            <p className="mt-5 max-w-xl text-base leading-8 text-muted-foreground lg:text-lg">{text}</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {actions.map((action) => <HeroButton key={`${action.href}-${action.label}`} action={action} />)}
            </div>
          </div>
        </MotionReveal>
        <MotionReveal delay={0.05}>
          <div className="premium-surface shine-hover relative aspect-[16/5] overflow-hidden rounded-[2rem] p-3 sm:aspect-[16/6] lg:aspect-[16/9]">
            <div className="relative h-full overflow-hidden rounded-[1.5rem]">
              <Image src={image} alt={imageAlt} fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 58vw" />
              <div className="absolute bottom-4 left-4 right-4 hidden gap-3 rounded-[1.35rem] bg-white/92 p-4 shadow-xl backdrop-blur sm:grid sm:grid-cols-3">
                {[
                  ['Location', companyInfo.locationName],
                  ['Packages', `${publicPackages.length} curated options`],
                  ['Booking', 'Availability request']
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
                    <p className="mt-1 font-heading text-sm font-semibold text-foreground sm:text-base">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </MotionReveal>
      </div>
    </section>
  );
}

type HeroAction = {
  href: string;
  label: string;
  icon?: LucideIcon;
  variant?: 'default' | 'outline' | 'gold';
  external?: boolean;
};

function HeroButton({ action }: { action: HeroAction }) {
  const Icon = action.icon;
  const content = (
    <>
      {Icon ? <Icon data-icon aria-hidden="true" /> : null}
      {action.label}
    </>
  );

  if (action.external || action.href.startsWith('http') || action.href.startsWith('tel:') || action.href.startsWith('mailto:')) {
    return (
      <Button asChild variant={action.variant ?? 'default'} size="lg">
        <a href={action.href} target={action.href.startsWith('http') ? '_blank' : undefined} rel={action.href.startsWith('http') ? 'noopener noreferrer' : undefined}>{content}</a>
      </Button>
    );
  }

  return (
    <Button asChild variant={action.variant ?? 'default'} size="lg">
      <Link href={action.href}>{content}</Link>
    </Button>
  );
}

function SectionHeader({ title, text, action }: { title: string; text: string; action?: { href: string; label: string } }) {
  return (
    <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
      <div className="max-w-3xl">
        <h2 className="section-title">{title}</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">{text}</p>
      </div>
      {action ? <Button asChild variant="outline"><Link href={action.href}>{action.label}<ArrowRight data-icon aria-hidden="true" /></Link></Button> : null}
    </div>
  );
}

function PackageGrid({ packages, className }: { packages: PublicPackage[]; className?: string }) {
  return (
    <div className={cn('grid gap-5 md:grid-cols-2 xl:grid-cols-3', className)}>
      {packages.map((packageItem, index) => (
        <MotionReveal key={packageItem.slug} delay={index * 0.025}>
          <PackageCard packageItem={packageItem} />
        </MotionReveal>
      ))}
    </div>
  );
}

function PackageCard({ packageItem }: { packageItem: PublicPackage }) {
  const bookingHref = getBookingHref(packageItem.slug);
  const whatsappMessage = encodeURIComponent(`Hello eDrive, I am interested in the ${packageItem.name} package.`);
  const shouldRenderImage = packageItem.image && !packageItem.image.includes('/images/placeholders/');

  return (
    <article className="premium-surface premium-card-hover group flex h-full min-w-0 flex-col overflow-hidden rounded-[1.75rem] p-3">
      <div className="relative aspect-[16/10] overflow-hidden rounded-[1.35rem]">
        {shouldRenderImage ? (
          <Image src={packageItem.image} alt={packageItem.name} fill className="object-cover transition duration-700 group-hover:scale-105" sizes="(max-width: 1024px) 100vw, 33vw" />
        ) : (
          <CategoryVisual category={packageItem.category} />
        )}
        {packageItem.badge ? <div className="absolute left-3 top-3"><Badge variant={packageItem.category === 'vip' ? 'gold' : 'default'}>{packageItem.badge}</Badge></div> : null}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{packageCategoryLabels[packageItem.category]}</Badge>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground"><Clock className="size-3.5 text-primary" aria-hidden="true" />{packageItem.duration}</span>
        </div>
        <h3 className="mt-4 font-heading text-xl font-semibold leading-tight text-foreground">{packageItem.name}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{packageItem.description}</p>
        <div className="mt-4 grid gap-2 rounded-[1.1rem] bg-primary-50 px-4 py-3 text-sm">
          <p className="font-semibold text-primary-900">{packageItem.priceLabel}</p>
          <p className="text-xs leading-5 text-muted-foreground"><span className="font-semibold text-foreground">Best for:</span> {packageItem.bestFor}</p>
        </div>
        <div className="mt-auto flex flex-col gap-2 pt-5 sm:flex-row">
          <Button asChild size="sm" className="flex-1"><Link href={bookingHref}>Book This Package<ArrowRight data-icon aria-hidden="true" /></Link></Button>
          <Button asChild size="sm" variant="outline" className="flex-1"><a href={`${whatsappUrl}?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer"><MessageCircle data-icon aria-hidden="true" />Ask on WhatsApp</a></Button>
        </div>
      </div>
    </article>
  );
}

function CategoryVisual({ category }: { category: PublicPackageCategory }) {
  const Icon = categoryIcons[category];
  return (
    <div className={cn('flex h-full w-full items-center justify-center bg-gradient-to-br', categoryVisualClasses[category])}>
      <div className="absolute inset-0 soft-grid opacity-35" />
      <div className="relative flex flex-col items-center gap-3 text-center">
        <span className="flex size-16 items-center justify-center rounded-full border border-white/35 bg-white/20 shadow-glass backdrop-blur">
          <Icon className="size-8" aria-hidden="true" />
        </span>
        <span className="px-4 text-xs font-bold uppercase tracking-[0.18em]">{packageCategoryLabels[category]}</span>
      </div>
    </div>
  );
}

function FleetPreviewCard({ title, text, image, href, cta, icon: Icon }: { title: string; text: string; image: string; href: string; cta: string; icon: LucideIcon }) {
  return (
    <article className="premium-surface premium-card-hover grid gap-4 rounded-[1.75rem] p-3 sm:grid-cols-[0.95fr_1.05fr]">
      <div className="relative min-h-[230px] overflow-hidden rounded-[1.35rem]">
        <Image src={image} alt={title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 45vw" />
      </div>
      <div className="flex flex-col justify-center p-4">
        <Icon className="size-7 text-primary" aria-hidden="true" />
        <h3 className="mt-4 font-heading text-2xl font-semibold text-foreground">{title}</h3>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">{text}</p>
        <Button asChild className="mt-5 w-fit"><Link href={href}>{cta}<ArrowRight data-icon aria-hidden="true" /></Link></Button>
      </div>
    </article>
  );
}

function FeatureGrid({ items, className }: { items: Array<{ icon: LucideIcon; title: string; text: string }>; className?: string }) {
  return (
    <div className={cn('grid gap-5 sm:grid-cols-2', className)}>
      {items.map((item) => <FeatureCard key={item.title} {...item} />)}
    </div>
  );
}

function FeatureCard({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="premium-surface premium-card-hover h-full rounded-[1.5rem] p-5">
      <span className="flex size-11 items-center justify-center rounded-2xl bg-primary-100 text-primary"><Icon className="size-5" aria-hidden="true" /></span>
      <h3 className="mt-4 font-heading text-xl font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
    </div>
  );
}

function ExperienceSplit({ title, text, image, href, cta, icon: Icon }: { title: string; text: string; image: string; href: string; cta: string; icon: LucideIcon }) {
  return (
    <article className="grid overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] p-3 sm:grid-cols-[0.9fr_1.1fr]">
      <div className="relative min-h-[220px] overflow-hidden rounded-[1.5rem]">
        <Image src={image} alt={title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 45vw" />
      </div>
      <div className="flex flex-col justify-center p-5">
        <Icon className="size-7 text-accent-500" aria-hidden="true" />
        <h2 className="mt-4 font-heading text-3xl font-semibold text-white">{title}</h2>
        <p className="mt-3 text-sm leading-7 text-white/70">{text}</p>
        <Button asChild variant="gold" className="mt-5 w-fit"><Link href={href}>{cta}<ArrowRight data-icon aria-hidden="true" /></Link></Button>
      </div>
    </article>
  );
}

function TierMiniCard({ tier }: { tier: (typeof membershipTiers)[number] }) {
  return (
    <div className={cn('rounded-[1.5rem] p-5 shadow-glass', tier.tone === 'dark' ? 'bg-primary-900 text-white' : tier.tone === 'gold' ? 'bg-accent-50 text-foreground' : 'bg-white/78 text-foreground')}>
      <h3 className="font-heading text-lg font-semibold">{tier.name}</h3>
      <p className={cn('mt-2 text-xs leading-5', tier.tone === 'dark' ? 'text-white/70' : 'text-muted-foreground')}>{tier.bestFor}</p>
    </div>
  );
}

function RelatedLinks({ links, compact = false }: { links: Array<{ href: string; label: string; text: string }>; compact?: boolean }) {
  return (
    <div className={cn('grid gap-4', compact ? 'mt-5' : 'mt-7 sm:grid-cols-2')}>
      {links.map((link) => (
        <Link key={link.href} href={link.href} className="premium-surface premium-card-hover block rounded-[1.5rem] p-5">
          <span className="font-heading text-lg font-semibold text-foreground">{link.label}</span>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{link.text}</p>
        </Link>
      ))}
    </div>
  );
}

function LocationHighlight() {
  return (
    <section className="border-y border-border bg-white/70">
      <div className={cn('container-x grid gap-7 lg:grid-cols-[0.9fr_1.1fr] lg:items-center', sectionPad)}>
        <div>
          <h2 className="section-title">Dubai Islands Location Highlight</h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">Plan your Dubai Islands water sports experience around a premium marina setting, easy contact options, and package-led booking from Rentals, Fleet, Membership, and Contact.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild><a href={companyInfo.mapLink} target="_blank" rel="noopener noreferrer"><MapPin data-icon aria-hidden="true" />Get Directions</a></Button>
            <Button asChild variant="outline"><Link href="/contact">Contact eDrive</Link></Button>
          </div>
        </div>
        <div className="premium-surface overflow-hidden rounded-[2rem] p-3">
          <div className="relative aspect-[16/9] overflow-hidden rounded-[1.5rem]">
            <Image src={dubaiWaterfrontImage} alt="Dubai Islands water sports location" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 55vw" />
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCta({ title, text }: { title: string; text: string }) {
  return (
    <section className="py-10 sm:py-12">
      <div className="container-x">
        <div className="premium-surface rounded-[2rem] bg-primary-900 p-7 text-white sm:p-8 lg:flex lg:items-center lg:justify-between lg:gap-8">
          <div>
            <h2 className="font-heading text-3xl font-semibold leading-tight text-white sm:text-4xl">{title}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/70">{text}</p>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0">
            <Button asChild variant="gold"><Link href="/rentals"><TicketCheck data-icon aria-hidden="true" />Explore Rentals</Link></Button>
            <Button asChild variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white hover:text-primary-900"><a href={whatsappUrl} target="_blank" rel="noopener noreferrer"><MessageCircle data-icon aria-hidden="true" />Ask on WhatsApp</a></Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function FleetCard({ icon: Icon, type, capacity, bestFor, image }: { icon: LucideIcon; type: string; capacity: string; bestFor: string; image: string }) {
  return (
    <article className="premium-surface premium-card-hover h-full overflow-hidden rounded-[1.75rem] p-3">
      <div className="relative aspect-[16/10] overflow-hidden rounded-[1.35rem]">
        <Image src={image} alt={type} fill className="object-cover" sizes="(max-width: 1280px) 50vw, 33vw" />
      </div>
      <div className="p-4">
        <Icon className="size-7 text-primary" aria-hidden="true" />
        <h3 className="mt-4 font-heading text-2xl font-semibold text-foreground">{type}</h3>
        <dl className="mt-4 grid gap-3 rounded-[1.2rem] bg-primary-50 p-4 text-sm">
          <div><dt className="font-semibold text-foreground">Capacity</dt><dd className="mt-1 text-muted-foreground">{capacity}</dd></div>
          <div><dt className="font-semibold text-foreground">Best for</dt><dd className="mt-1 text-muted-foreground">{bestFor}</dd></div>
        </dl>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button asChild size="sm"><Link href="/rentals">Book This Ride<ArrowRight data-icon aria-hidden="true" /></Link></Button>
          <Button asChild size="sm" variant="outline"><Link href="/rentals">View Rental Packages</Link></Button>
        </div>
      </div>
    </article>
  );
}

function FAQSection({ title, items }: { title: string; items: Array<[string, string]> }) {
  return (
    <section className={cn('container-x', sectionPad)}>
      <SectionHeader title={title} text="Helpful answers for public website visitors comparing eDrive Water Sports packages in Dubai." />
      <div className="mt-7 grid gap-3">
        {items.map(([question, answer]) => (
          <details key={question} className="group rounded-[1.35rem] border border-white/80 bg-white/78 px-5 py-4 shadow-glass">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-heading text-lg font-semibold text-foreground">
              {question}
              <ArrowRight className="size-4 shrink-0 text-primary transition group-open:rotate-90" aria-hidden="true" />
            </summary>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function RelatedBand({ links }: { links: Array<{ href: string; label: string }> }) {
  return (
    <section className="border-y border-border bg-white/70 py-8">
      <div className="container-x flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <p className="font-heading text-xl font-semibold text-foreground">Explore related eDrive pages</p>
        <div className="flex flex-wrap gap-3">
          {links.map((link) => <Button key={link.href} asChild variant="outline" size="sm"><Link href={link.href}>{link.label}</Link></Button>)}
        </div>
      </div>
    </section>
  );
}

function SalesInquiryCard({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <article className="premium-surface premium-card-hover rounded-[2rem] p-6">
      <Icon className="size-8 text-primary" aria-hidden="true" />
      <h2 className="mt-4 font-heading text-3xl font-semibold text-foreground">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">{text}</p>
      <Button asChild className="mt-5"><Link href="/contact">Request Sales Availability<ArrowRight data-icon aria-hidden="true" /></Link></Button>
    </article>
  );
}

function InfoPanel({ title, text, cta, href, icon: Icon, external = false }: { title: string; text: string; cta: string; href: string; icon: LucideIcon; external?: boolean }) {
  return (
    <div className="premium-surface premium-card-hover rounded-[2rem] p-6 sm:p-7">
      <Icon className="size-8 text-primary" aria-hidden="true" />
      <h2 className="mt-4 font-heading text-3xl font-semibold text-foreground">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">{text}</p>
      <Button asChild className="mt-5">
        {external ? <a href={href} target="_blank" rel="noopener noreferrer">{cta}<ArrowRight data-icon aria-hidden="true" /></a> : <Link href={href}>{cta}<ArrowRight data-icon aria-hidden="true" /></Link>}
      </Button>
    </div>
  );
}

function TimelineSection({ title, steps }: { title: string; steps: string[] }) {
  return (
    <section className="border-y border-border bg-white/70">
      <div className={cn('container-x', sectionPad)}>
        <SectionHeader title={title} text="A simple public workflow designed to move customers from interest to a confirmed next step." />
        <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {steps.map((step, index) => (
            <div key={step} className="premium-surface rounded-[1.5rem] p-5">
              <span className="flex size-10 items-center justify-center rounded-full bg-primary-900 text-sm font-bold text-white">{index + 1}</span>
              <h3 className="mt-4 font-heading text-lg font-semibold text-foreground">{step}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryAnchor({ href, label, count, icon: Icon }: { href: string; label: string; count: number; icon: LucideIcon }) {
  return (
    <Link href={href} className="premium-surface premium-card-hover flex min-h-32 flex-col justify-between rounded-[1.5rem] p-5">
      <Icon className="size-6 text-primary" aria-hidden="true" />
      <span className="mt-4 font-heading text-lg font-semibold text-foreground">{label}</span>
      <span className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{count} packages</span>
    </Link>
  );
}

function categorySectionId(category: PublicPackageCategory) {
  return `${category}-packages`;
}

function categoryHeading(category: PublicPackageCategory) {
  if (category === 'jet-ski') return 'Jet Ski Rental Packages in Dubai';
  if (category === 'jet-car') return 'Jet Car Rental Packages in Dubai';
  if (category === 'combo') return 'Jet Ski and Jet Car Packages Dubai';
  if (category === 'family') return 'Family Water Sports Packages';
  return 'VIP Water Sports Experiences';
}

function MembershipTierCard({ tier }: { tier: (typeof membershipTiers)[number] }) {
  return (
    <article className={cn('premium-card-hover flex h-full flex-col rounded-[2rem] border p-6 shadow-glass', tier.tone === 'dark' ? 'border-accent-500/50 bg-primary-900 text-white' : tier.tone === 'gold' ? 'border-accent-500/50 bg-accent-50 text-foreground' : 'border-white/80 bg-white/78 text-foreground')}>
      <h3 className={cn('font-heading text-2xl font-semibold', tier.tone === 'dark' ? 'text-white' : 'text-foreground')}>{tier.name}</h3>
      <p className={cn('mt-2 text-sm leading-6', tier.tone === 'dark' ? 'text-white/70' : 'text-muted-foreground')}><span className="font-semibold">Best for:</span> {tier.bestFor}</p>
      <ul className="mt-5 grid gap-3">
        {tier.benefits.map((benefit) => (
          <li key={benefit} className={cn('flex gap-3 text-sm leading-6', tier.tone === 'dark' ? 'text-white/78' : 'text-muted-foreground')}>
            <CheckCircle2 className={cn('mt-0.5 size-4 shrink-0', tier.tone === 'dark' ? 'text-accent-500' : 'text-primary')} aria-hidden="true" />
            {benefit}
          </li>
        ))}
      </ul>
      <Button asChild variant={tier.tone === 'dark' ? 'gold' : 'default'} className="mt-auto w-full"><Link href="/contact">{tier.cta}</Link></Button>
    </article>
  );
}

function ContactLine({ icon: Icon, label, value, href, external = false }: { icon: LucideIcon; label: string; value: string; href: string; external?: boolean }) {
  return (
    <a href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined} className="premium-surface premium-card-hover flex items-center gap-4 rounded-[1.35rem] p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary"><Icon className="size-5" aria-hidden="true" /></span>
      <span className="min-w-0">
        <span className="block text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
        <span className="mt-1 block break-words text-sm font-semibold text-foreground">{value}</span>
      </span>
    </a>
  );
}
