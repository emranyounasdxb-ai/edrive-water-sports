'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { formatAed } from '@/lib/booking-data';
import { whatsappUrl } from '@/lib/company-info';
import { localizeHref, type PublicLocale } from '@/lib/i18n/locales';
import { enMessages } from '@/lib/i18n/messages/en';
import type { HomeMessages } from '@/lib/i18n/types';
import { dubaiWaterfrontImage } from '@/lib/mock-data';
import { getPackagePricePresentation, type PackagePricingFields } from '@/lib/package-pricing';
import { cn } from '@/lib/utils';
import { HeroVideoMedia } from './hero-video-media';
import { publicHeroContentClass, publicHeroFrameClass } from './public-hero-layout';

const summerHeroImage = '/images/edrive/home/home-summer-offer-hero.webp';
const autoplayDelay = 6500;
const swipeThreshold = 52;

type PublicOfferPackage = PackagePricingFields & {
  id: string;
  title: string;
  category: string;
};

type OfferSummary = {
  count: number;
  lowestPrice: number;
};

export function HomeHeroCarousel({ locale = 'en', messages = enMessages.home }: { locale?: PublicLocale; messages?: HomeMessages }) {
  const [offerSummary, setOfferSummary] = useState<OfferSummary | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [pointerInside, setPointerInside] = useState(false);
  const [focusInside, setFocusInside] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [timerVersion, setTimerVersion] = useState(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const hasSummerSlide = Boolean(offerSummary);
  const slideCount = hasSummerSlide ? 2 : 1;

  useEffect(() => {
    let mounted = true;
    let idleHandle: number | undefined;
    let timerHandle: ReturnType<typeof setTimeout> | undefined;
    const idleWindow = window as Window & {
      requestIdleCallback?: Window['requestIdleCallback'];
      cancelIdleCallback?: Window['cancelIdleCallback'];
    };

    async function loadOffers() {
      const { supabase } = await import('@/lib/supabase-client');
      const { data, error } = await supabase.rpc('get_public_packages', { p_categories: null });
      if (!mounted) return;
      if (error) {
        setOfferSummary(null);
        return;
      }

      const activeOffers = ((data || []) as PublicOfferPackage[])
        .map((item) => getPackagePricePresentation(item, 'b2c'))
        .filter((price) => price.active);

      if (!activeOffers.length) {
        setOfferSummary(null);
        return;
      }

      setOfferSummary({
        count: activeOffers.length,
        lowestPrice: Math.min(...activeOffers.map((price) => price.effectivePrice))
      });
    }

    const scheduleLoad = () => {
      if (typeof idleWindow.requestIdleCallback === 'function') {
        idleHandle = idleWindow.requestIdleCallback(() => void loadOffers(), { timeout: 1600 });
        return;
      }
      timerHandle = setTimeout(() => void loadOffers(), 600);
    };

    if (document.readyState === 'complete') scheduleLoad();
    else window.addEventListener('load', scheduleLoad, { once: true });

    return () => {
      mounted = false;
      window.removeEventListener('load', scheduleLoad);
      if (idleHandle !== undefined) idleWindow.cancelIdleCallback?.(idleHandle);
      if (timerHandle !== undefined) clearTimeout(timerHandle);
    };
  }, []);

  useEffect(() => {
    if (hasSummerSlide) return;
    setActiveSlide(0);
  }, [hasSummerSlide]);

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => setReducedMotion(motionQuery.matches);
    const updateVisibility = () => setPageVisible(document.visibilityState === 'visible');
    updateMotion();
    updateVisibility();
    motionQuery.addEventListener?.('change', updateMotion);
    document.addEventListener('visibilitychange', updateVisibility);
    return () => {
      motionQuery.removeEventListener?.('change', updateMotion);
      document.removeEventListener('visibilitychange', updateVisibility);
    };
  }, []);

  const autoplayPaused = pointerInside || focusInside || !pageVisible || reducedMotion;

  useEffect(() => {
    if (slideCount < 2 || autoplayPaused) return;
    const timer = window.setTimeout(() => setActiveSlide((current) => (current + 1) % slideCount), autoplayDelay);
    return () => window.clearTimeout(timer);
  }, [activeSlide, autoplayPaused, slideCount, timerVersion]);

  const showSlide = useCallback((index: number) => {
    setActiveSlide(((index % slideCount) + slideCount) % slideCount);
    setTimerVersion((value) => value + 1);
  }, [slideCount]);

  const previousSlide = useCallback(() => showSlide(activeSlide - 1), [activeSlide, showSlide]);
  const nextSlide = useCallback(() => showSlide(activeSlide + 1), [activeSlide, showSlide]);

  const planeTransition = reducedMotion
    ? 'transition-opacity duration-150'
    : 'transition-transform duration-[800ms] ease-[cubic-bezier(0.64,0,0.36,1)]';
  const slideOnePosition = reducedMotion
    ? (activeSlide === 0 ? 'opacity-100' : 'opacity-0')
    : (activeSlide === 0 ? 'translate-x-0' : '-translate-x-full');
  const slideTwoPosition = reducedMotion
    ? (activeSlide === 1 ? 'opacity-100' : 'opacity-0')
    : (activeSlide === 1 ? 'translate-x-0' : 'translate-x-full');

  function handleTouchEnd(event: React.TouchEvent<HTMLElement>) {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || slideCount < 2) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Math.abs(deltaX) < swipeThreshold || Math.abs(deltaX) <= Math.abs(deltaY)) return;
    if (deltaX < 0) nextSlide();
    else previousSlide();
  }

  return (
    <section
      className={publicHeroFrameClass}
      data-public-hero
      data-home-hero-carousel
      aria-label={messages.carouselAria}
      aria-roledescription="carousel"
      onPointerEnter={() => setPointerInside(true)}
      onPointerLeave={() => setPointerInside(false)}
      onFocusCapture={() => setFocusInside(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocusInside(false);
      }}
      onTouchStart={(event) => {
        const touch = event.touches[0];
        touchStart.current = { x: touch.clientX, y: touch.clientY };
      }}
      onTouchEnd={handleTouchEnd}
    >
      <HeroVideoMedia fallbackImage={dubaiWaterfrontImage} fallbackAlt={messages.heroFallbackAlt} priority objectPosition="object-[68%_68%]" mediaClassName={cn(planeTransition, slideOnePosition)} />

      <div
        className={cn('absolute inset-0 z-10', planeTransition, slideOnePosition, activeSlide !== 0 && 'pointer-events-none')}
        role="group"
        aria-roledescription="slide"
        aria-label={messages.slideOneAria.replace('2', String(slideCount))}
        aria-hidden={activeSlide !== 0}
      >
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,27,39,0.98)_0%,rgba(5,35,48,0.90)_34%,rgba(5,35,48,0.38)_58%,rgba(5,35,48,0.04)_82%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,23,33,0.36)_0%,transparent_38%,rgba(4,23,33,0.24)_100%)]" />

        <div className={publicHeroContentClass}>
          <div>
            <div className="max-w-2xl">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-accent-300">{messages.heroEyebrow}</p>
              <h1 className="font-heading text-4xl font-semibold leading-[1.03] text-white sm:text-5xl lg:text-[3.45rem]">
                {messages.heroTitleLine1}
                <span className="mt-1 block text-primary-300">{messages.heroTitleLine2}</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-white/82 sm:text-lg">{messages.heroText}</p>
              <div className="mt-8 flex">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  tabIndex={activeSlide === 0 ? 0 : -1}
                  className="inline-flex min-h-12 w-auto items-center justify-center gap-2 rounded-full border border-emerald-300/45 bg-[#25D366] px-6 text-sm font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.32),0_14px_28px_rgba(37,211,102,0.22)] transition hover:-translate-y-0.5 hover:bg-[#1EBE5D] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.38),0_18px_36px_rgba(37,211,102,0.30)]"
                >
                  <span>{messages.checkAvailability}</span>
                  <ArrowRight className="size-4 shrink-0" data-icon-directional aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {hasSummerSlide ? (
        <div
          className={cn('absolute inset-0 z-10', planeTransition, slideTwoPosition, activeSlide !== 1 && 'pointer-events-none')}
          role="group"
          aria-roledescription="slide"
          aria-label={messages.slideTwoAria}
          aria-hidden={activeSlide !== 1}
        >
          <Image
            src={summerHeroImage}
            alt={messages.slideTwoAria}
            fill
            sizes="100vw"
            className="object-cover object-[68%_center] sm:object-center"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(4,23,34,0.98)_0%,rgba(5,30,43,0.94)_36%,rgba(5,35,48,0.52)_62%,rgba(5,35,48,0.06)_88%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,23,33,0.30)_0%,transparent_38%,rgba(4,23,33,0.48)_100%)]" />
          <div className={publicHeroContentClass}>
            <div className="mx-11 max-w-[44rem] pb-10 sm:mx-14 sm:pb-8 lg:mx-16">
              <span className="inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 text-[10px] font-bold uppercase tracking-[0.075em] text-white shadow-[0_4px_12px_rgba(217,119,6,0.24)]">
                <Sparkles className="size-3" aria-hidden="true" />{messages.summerEyebrow}
              </span>
              <h2 className="mt-4 font-heading text-4xl font-semibold leading-[1.03] text-white sm:text-5xl lg:text-[3.45rem]">
                {messages.summerTitle}
                <span className="mt-1 block text-amber-300">{messages.summerTagline}</span>
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/85 sm:text-lg">{messages.summerText}</p>
              {offerSummary ? <p className="mt-4 w-fit rounded-full border border-white/15 bg-primary-900/60 px-3 py-1.5 text-xs font-bold text-white/90 backdrop-blur-sm">{offerSummary.count} {offerSummary.count === 1 ? messages.summerOffer : messages.summerOffers} {messages.summerLive} <span aria-hidden="true">·</span> {messages.from} {formatAed(offerSummary.lowestPrice)}</p> : null}
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href={localizeHref(locale, '/rentals#live-packages')} tabIndex={activeSlide === 1 ? 0 : -1} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-amber-400 px-6 text-sm font-bold text-primary-900 shadow-[0_14px_28px_rgba(245,158,11,0.22)] transition hover:-translate-y-0.5 hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-900">{messages.exploreSummer}<ArrowRight className="size-4" data-icon-directional aria-hidden="true" /></Link>
                <Link href={localizeHref(locale, '/booking')} tabIndex={activeSlide === 1 ? 0 : -1} className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/35 bg-white/10 px-6 text-sm font-bold text-white backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-900">{messages.bookSummer}</Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {slideCount > 1 ? (
        <>
          <button type="button" onClick={previousSlide} className="absolute left-2.5 top-1/2 z-30 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/35 bg-primary-900/45 text-white shadow-[0_8px_22px_rgba(4,23,33,0.28)] backdrop-blur-sm transition hover:border-white/60 hover:bg-primary-900/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-900 sm:left-5 sm:size-11 lg:left-6 lg:size-12" aria-label={messages.previousSlide}>
            <ArrowLeft className="size-[18px] sm:size-5" data-icon-directional aria-hidden="true" />
          </button>
          <button type="button" onClick={nextSlide} className="absolute right-2.5 top-1/2 z-30 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/35 bg-primary-900/45 text-white shadow-[0_8px_22px_rgba(4,23,33,0.28)] backdrop-blur-sm transition hover:border-white/60 hover:bg-primary-900/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-900 sm:right-5 sm:size-11 lg:right-6 lg:size-12" aria-label={messages.nextSlide}>
            <ArrowRight className="size-[18px] sm:size-5" data-icon-directional aria-hidden="true" />
          </button>
        </>
      ) : null}
    </section>
  );
}
