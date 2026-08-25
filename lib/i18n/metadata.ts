import type { Metadata } from 'next';
import { getPublicMessages } from '@/lib/i18n/get-messages';
import { publicLocales, publicUrl, type PublicLocale, type PublicRouteSlug } from '@/lib/i18n/locales';
import type { PublicMessages } from '@/lib/i18n/types';

type RouteKey = keyof PublicMessages['routes'];

const routeSlugs: Record<RouteKey, PublicRouteSlug> = {
  home: '', fleet: 'fleet', rentals: 'rentals', jetSki: 'jet-ski-rentals', jetCar: 'jet-car-rentals', membership: 'membership', booking: 'booking', myBooking: 'my-booking', contact: 'contact', privacy: 'privacy-policy', terms: 'terms-and-conditions', refund: 'refund-replacement-policy'
};

export function createPublicMetadata(locale: PublicLocale, route: RouteKey): Metadata {
  const content = getPublicMessages(locale).routes[route];
  const slug = routeSlugs[route];
  const canonical = publicUrl(locale, slug);
  const languages = Object.fromEntries(publicLocales.map((item) => [item, publicUrl(item, slug)]));

  return {
    title: route === 'home' ? { absolute: content.title } : content.title,
    description: content.description,
    alternates: { canonical, languages: { ...languages, 'x-default': publicUrl('en', slug) } },
    openGraph: { title: content.title, description: content.description, url: canonical, siteName: 'eDrive Water Sports', images: [{ url: '/brand/og-image.png', width: 1200, height: 630, alt: content.title }], type: 'website', locale: locale === 'ar' ? 'ar_AE' : locale === 'ru' ? 'ru_RU' : 'en_AE' },
    twitter: { card: 'summary_large_image', title: content.title, description: content.description, images: ['/brand/og-image.png'] }
  };
}
