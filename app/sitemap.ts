import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

const siteUrl = 'https://edrivewatersports.ae';
const now = new Date('2026-07-02T00:00:00.000Z');

const routes = [
  '',
  'fleet',
  'sales',
  'rentals',
  'membership',
  'booking',
  'contact',
  'privacy-policy',
  'terms-and-conditions',
  'refund-replacement-policy'
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: route ? `${siteUrl}/${route}` : siteUrl,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: route === '' ? 1 : route === 'booking' ? 0.45 : 0.8
  }));
}
