import Image from 'next/image';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, CalendarCheck, MapPin, MessageCircle, Phone, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { companyInfo, whatsappUrl } from '@/lib/company-info';
import { localizeHref, type PublicLocale } from '@/lib/i18n/locales';
import { enMessages } from '@/lib/i18n/messages/en';
import type { HomeMessages } from '@/lib/i18n/types';
import { cn } from '@/lib/utils';
import { HomeHeroCarousel } from './home-hero-carousel';

const sectionPad = 'py-10 sm:py-12 lg:py-14';

const whyIcons = [MapPin, ShieldCheck, MessageCircle, CalendarCheck];
const stepIcons = [Sparkles, CalendarCheck, MessageCircle];

export function HomePage({ locale = 'en', messages = enMessages.home }: { locale?: PublicLocale; messages?: HomeMessages }) {
  const whyChoose = messages.whyItems.map((item, index) => ({ ...item, icon: whyIcons[index] }));
  const bookingSteps = messages.howItems.map((item, index) => ({ ...item, icon: stepIcons[index] }));
  return (
    <>
      <HomeHeroCarousel locale={locale} messages={messages} />

      <section className="bg-[#f4f5f5]" data-home-rides>
        <div className={cn('container-x', sectionPad)}>
          <SectionHeader title={messages.experiencesTitle} text={messages.experiencesText} />
          <div className="mt-7 grid gap-5 md:grid-cols-2">
            <HomeRideCard
              title={messages.jetSkiTitle}
              text={messages.jetSkiText}
              image="/images/edrive/home/home-jet-ski-rentals.webp"
              mobileImage="/images/edrive/home/home-jet-ski-rentals-768.webp"
              href={localizeHref(locale, '/jet-ski-rentals')}
              cta={messages.jetSkiCta}
              data-home-ride-card
            />
            <HomeRideCard
              title={messages.jetCarTitle}
              text={messages.jetCarText}
              image="/images/edrive/home/home-jet-car-rentals.webp"
              mobileImage="/images/edrive/home/home-jet-car-rentals-768.webp"
              href={localizeHref(locale, '/jet-car-rentals')}
              cta={messages.jetCarCta}
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
              <Image src="/images/edrive/home/home-membership-gold-card.webp" alt={messages.membershipImageAlt} width={1200} height={800} className="h-full min-h-64 w-full object-cover" />
            </picture>
            <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-10">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent-300">{messages.membershipEyebrow}</p>
              <h2 className="mt-3 font-heading text-3xl font-semibold leading-tight sm:text-4xl">{messages.membershipTitle}</h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/80 sm:text-base">{messages.membershipText}</p>
              <Button asChild className="mt-6 w-fit rounded-full bg-accent-500 text-primary-900 hover:bg-accent-100"><Link href={localizeHref(locale, '/membership')}>{messages.membershipCta}<ArrowRight data-icon data-icon-directional aria-hidden="true" /></Link></Button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white/70" data-home-why>
        <div className={cn('container-x', sectionPad)}>
          <SectionHeader title={messages.whyTitle} text={messages.whyText} />
          <FeatureGrid items={whyChoose} className="mt-7 lg:grid-cols-4" />
        </div>
      </section>

      <section className="bg-[#f4f5f5]" data-home-process>
        <div className={cn('container-x grid gap-7 lg:grid-cols-[0.78fr_1.22fr] lg:items-center', sectionPad)}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">{messages.howEyebrow}</p>
            <h2 className="mt-3 section-title">{messages.howTitle}</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground sm:text-base">{messages.howText}</p>
          </div>
          <FeatureGrid items={bookingSteps} className="lg:grid-cols-3" />
        </div>
      </section>

      <HomeContactStrip messages={messages} />
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

function HomeContactStrip({ messages }: { messages: HomeMessages }) {
  return (
    <section className="bg-[#f4f5f5] pb-10 sm:pb-12 lg:pb-14" data-home-contact>
      <div className="container-x">
        <div className="flex flex-col gap-4 rounded-[1.5rem] bg-primary-900 p-5 text-white shadow-xl lg:flex-row lg:items-center lg:justify-between">
          <div><p className="text-[10px] font-bold uppercase tracking-[0.22em] text-accent-300">{messages.helpEyebrow}</p><h2 className="mt-2 font-heading text-2xl font-semibold">{messages.helpTitle}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-white/70">{messages.helpText}</p></div>
          <div className="flex flex-col gap-2 sm:flex-row"><Button asChild className="rounded-full bg-emerald-500 hover:bg-emerald-600"><a href={whatsappUrl} target="_blank" rel="noopener noreferrer"><MessageCircle data-icon aria-hidden="true" />{messages.chatWhatsapp}</a></Button><Button asChild variant="outline" className="rounded-full bg-white text-primary-900 hover:bg-primary-50"><a href={`tel:${companyInfo.landlineHref}`}><Phone data-icon aria-hidden="true" />{messages.callNow}</a></Button></div>
        </div>
      </div>
    </section>
  );
}
