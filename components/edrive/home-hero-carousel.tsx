'use client';

import Link from 'next/link';
import { TicketCheck } from 'lucide-react';
import { localizeHref, type PublicLocale } from '@/lib/i18n/locales';
import { enMessages } from '@/lib/i18n/messages/en';
import type { HomeMessages } from '@/lib/i18n/types';
import { dubaiWaterfrontImage } from '@/lib/mock-data';
import { HeroVideoMedia } from './hero-video-media';
import { publicHeroContentClass, publicHeroFrameClass } from './public-hero-layout';
import { usePublicLocale } from './public-locale-provider';

export function HomeHeroCarousel({ locale = 'en', messages = enMessages.home }: { locale?: PublicLocale; messages?: HomeMessages }) {
  const { messages: publicMessages } = usePublicLocale();

  return (
    <section className={publicHeroFrameClass} data-public-hero data-home-hero aria-label={messages.heroEyebrow}>
      <HeroVideoMedia fallbackImage={dubaiWaterfrontImage} fallbackAlt={messages.heroFallbackAlt} priority objectPosition="object-[68%_68%]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,27,39,0.98)_0%,rgba(5,35,48,0.90)_34%,rgba(5,35,48,0.38)_58%,rgba(5,35,48,0.04)_82%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,23,33,0.36)_0%,transparent_38%,rgba(4,23,33,0.24)_100%)]" />

      <div className={publicHeroContentClass}>
        <div className="max-w-2xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-accent-300">{messages.heroEyebrow}</p>
          <h1 className="font-heading text-4xl font-semibold leading-[1.03] text-white sm:text-5xl lg:text-[3.45rem]">
            {messages.heroTitleLine1}
            <span className="mt-1 block text-primary-300">{messages.heroTitleLine2}</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/82 sm:text-lg">{messages.heroText}</p>
          <div className="mt-8 flex">
            <Link href={localizeHref(locale, '/my-booking')} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-cyan-200/60 bg-white px-6 text-sm font-bold text-primary-900 shadow-[0_14px_28px_rgba(0,139,156,0.22)] transition hover:-translate-y-0.5 hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-900">
              <TicketCheck className="size-4" aria-hidden="true" />
              <span>{publicMessages.myBooking}</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
