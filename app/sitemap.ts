import type { MetadataRoute } from 'next';
import { publicLocales, publicRouteSlugs, publicUrl } from '@/lib/i18n/locales';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return publicLocales.flatMap((locale) => publicRouteSlugs.map((route) => ({
    url: publicUrl(locale, route),
    lastModified,
    changeFrequency: route === '' ? 'daily' as const : 'weekly' as const,
    priority: route === '' ? 1 : route === 'booking' || route === 'my-booking' ? 0.9 : 0.8,
    alternates: {
      languages: {
        en: publicUrl('en', route),
        ar: publicUrl('ar', route),
        ru: publicUrl('ru', route),
        'x-default': publicUrl('en', route)
      }
    }
  })));
}
