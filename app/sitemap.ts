import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

const siteUrl = 'https://edrivedubai.ae';

const routes = [
  '',
  'fleet',
  'membership',
  'booking',
  'my-booking',
  'contact',
  'privacy-policy',
  'terms-and-conditions',
  'refund-replacement-policy'
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return routes.map((route) => ({
    url: route ? `${siteUrl}/${route}/` : `${siteUrl}/`,
    lastModified,
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : route === 'booking' || route === 'my-booking' ? 0.9 : 0.8
  }));
}
