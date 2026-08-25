import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  CalendarCheck,
  Car,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { companyInfo, whatsappUrl } from '@/lib/company-info';
import { fleetHeroImage, jetCarLightImage, jetSkiLightImage } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import type { BookingMessages, ContactMessages, FleetMessages, PackageMessages, RouteMessages } from '@/lib/i18n/types';
import type { PublicLocale } from '@/lib/i18n/locales';
import { localizeHref } from '@/lib/i18n/locales';
import { enMessages } from '@/lib/i18n/messages/en';
import { BookingForm } from './booking-form';
import { ContactForm } from './contact-form';
import { PublicFleetShowcase } from './public-fleet-showcase';
import { PublicVideoHero, type PublicHeroAction } from './public-video-hero';

const sectionPad = 'py-10 sm:py-12 lg:py-14';

type HeroAction = PublicHeroAction;

const fleetIcons = [MapPin, ShieldCheck, MessageCircle, CalendarCheck];

export function FleetPage({ locale = 'en', messages = enMessages.routes.fleet, fleetMessages = enMessages.fleet }: { locale?: PublicLocale; messages?: RouteMessages; fleetMessages?: FleetMessages }) {
  const whyChoose = fleetMessages.qualityItems.map((item, index) => ({ ...item, icon: fleetIcons[index] || ShieldCheck }));
  return (
    <>
      <PublicHero
        title={messages.heroTitle || messages.title}
        text={messages.heroText || messages.description}
        image={fleetHeroImage}
        imageAlt={messages.heroAlt || messages.heroTitle || messages.title}
        actions={[
          { href: '#public-fleet', label: fleetMessages.exploreFleet, icon: Car },
          { href: localizeHref(locale, '/booking'), label: fleetMessages.bookRide, icon: CalendarCheck, variant: 'gold' }
        ]}
      />

      <div id="public-fleet">
        <PublicFleetShowcase locale={locale} messages={fleetMessages} />
      </div>

      <section className="border-y border-border bg-white/70">
        <div className={cn('container-x', sectionPad)}>
          <SectionHeader title={fleetMessages.qualityTitle} text={fleetMessages.qualityText} />
          <FeatureGrid items={whyChoose} className="mt-7 lg:grid-cols-4" />
        </div>
      </section>

      <section className="bg-[#f4f5f5] pb-12 pt-10 sm:pb-14 lg:pb-16">
        <div className="container-x">
          <div className="flex flex-col gap-5 rounded-[1.6rem] bg-primary-900 p-6 text-white shadow-xl sm:p-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent-300">{fleetMessages.ctaEyebrow}</p>
              <h2 className="mt-2 font-heading text-2xl font-semibold sm:text-3xl">{fleetMessages.ctaTitle}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">{fleetMessages.ctaText}</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button asChild className="rounded-full bg-white text-primary-900 hover:bg-primary-50"><Link href={localizeHref(locale, '/rentals')}>{fleetMessages.allPackages}<ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" /></Link></Button>
              <Button asChild variant="outline" className="rounded-full border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"><Link href={localizeHref(locale, '/booking')}>{fleetMessages.bookRide}</Link></Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export function BookingPage({ locale = 'en', messages = enMessages.routes.booking, bookingMessages = enMessages.booking, packageMessages = enMessages.packages }: { locale?: PublicLocale; messages?: RouteMessages; bookingMessages?: BookingMessages; packageMessages?: PackageMessages }) {
  return (
    <>
      <section className="container-x pt-8 text-center sm:pt-10">
        <h1 className="mx-auto max-w-3xl font-heading text-4xl font-semibold leading-tight text-foreground sm:text-5xl">{messages.heroTitle || messages.title}</h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">{messages.heroText || messages.description}</p>
      </section>
      <BookingForm locale={locale} messages={bookingMessages} packageMessages={packageMessages} />
    </>
  );
}

export function ContactPage({ locale = 'en', messages = enMessages.routes.contact, contactMessages = enMessages.contactForm, bookNowLabel = enMessages.common.bookNow }: { locale?: PublicLocale; messages?: RouteMessages; contactMessages?: ContactMessages; bookNowLabel?: string }) {
  const contacts = [
    { icon: MessageCircle, title: contactMessages.whatsapp, text: companyInfo.whatsappDisplay, href: whatsappUrl, external: true },
    { icon: Phone, title: contactMessages.callNow, text: companyInfo.landlineDisplay, href: `tel:${companyInfo.landlineHref}` },
    { icon: Mail, title: contactMessages.bookingEmail, text: companyInfo.bookingEmail, href: `mailto:${companyInfo.bookingEmail}` },
    { icon: MapPin, title: contactMessages.directions, text: companyInfo.locationName, href: companyInfo.mapLink, external: true }
  ];

  return (
    <>
      <PublicHero
        title={messages.heroTitle || messages.title}
        text={messages.heroText || messages.description}
        image={jetCarLightImage}
        imageAlt={messages.heroAlt || messages.heroTitle || messages.title}
        actions={[
          { href: whatsappUrl, label: contactMessages.whatsappUs, icon: MessageCircle, external: true },
          { href: `tel:${companyInfo.landlineHref}`, label: contactMessages.callNow, icon: Phone, variant: 'outline', external: true },
          { href: localizeHref(locale, '/booking'), label: bookNowLabel, icon: CalendarCheck, variant: 'gold' }
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
        <ContactForm locale={locale} messages={contactMessages} />
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
