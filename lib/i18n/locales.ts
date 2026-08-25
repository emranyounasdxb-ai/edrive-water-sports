export const publicLocales = ['en', 'ar', 'ru'] as const;
export const localizedPublicLocales = ['ar', 'ru'] as const;

export type PublicLocale = (typeof publicLocales)[number];
export type LocalizedPublicLocale = (typeof localizedPublicLocales)[number];

export const publicRouteSlugs = [
  '',
  'fleet',
  'rentals',
  'jet-ski-rentals',
  'jet-car-rentals',
  'membership',
  'booking',
  'my-booking',
  'contact',
  'privacy-policy',
  'terms-and-conditions',
  'refund-replacement-policy'
] as const;

export type PublicRouteSlug = (typeof publicRouteSlugs)[number];

export function isPublicLocale(value: string): value is PublicLocale {
  return publicLocales.includes(value as PublicLocale);
}

export function isLocalizedPublicLocale(value: string): value is LocalizedPublicLocale {
  return localizedPublicLocales.includes(value as LocalizedPublicLocale);
}

export function requireLocalizedPublicLocale(value: string): LocalizedPublicLocale {
  if (!isLocalizedPublicLocale(value)) throw new Error(`Unsupported localized public locale: ${value}`);
  return value;
}

export function publicPath(locale: PublicLocale, slug: PublicRouteSlug = '') {
  const suffix = slug ? `/${slug}` : '';
  return locale === 'en' ? suffix || '/' : `/${locale}${suffix}`;
}

export function publicUrl(locale: PublicLocale, slug: PublicRouteSlug = '') {
  const path = publicPath(locale, slug);
  return `https://edrivedubai.ae${path === '/' ? '/' : `${path}/`}`;
}

export function localeFromPathname(pathname: string): PublicLocale {
  const segment = pathname.split('/').filter(Boolean)[0];
  return segment && isPublicLocale(segment) && segment !== 'en' ? segment : 'en';
}

export function stripLocalePrefix(pathname: string) {
  const normalized = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return normalized.replace(/^\/(ar|ru)(?=\/|$)/, '') || '/';
}

export function localizeHref(locale: PublicLocale, href: string) {
  if (!href.startsWith('/') || href.startsWith('/admin')) return href;
  const [pathname, suffix = ''] = href.split(/(?=[?#])/u, 2);
  const clean = stripLocalePrefix(pathname).replace(/\/$/, '') || '/';
  const localized = locale === 'en' ? clean : `/${locale}${clean === '/' ? '' : clean}`;
  return `${localized}${suffix}`;
}

export function switchLocalePath(pathname: string, locale: PublicLocale) {
  const clean = stripLocalePrefix(pathname).replace(/\/$/, '') || '/';
  return locale === 'en' ? clean : `/${locale}${clean === '/' ? '' : clean}`;
}
