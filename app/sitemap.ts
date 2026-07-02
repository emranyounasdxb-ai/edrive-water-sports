import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

const siteUrl = 'https://edrivewatersports.ae';
const now = new Date('2026-07-02T00:00:00.000Z');

const routes = [
  '',
  'about',
  'jet-ski-rentals',
  'jet-car-rentals',
  'sales',
  'booking',
  'gallery',
  'contact',
  'admin',
  'admin/bookings',
  'admin/vehicles',
  'admin/inventory',
  'admin/coupons',
  'admin/reports',
  'admin/staff-management'
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: route ? `${siteUrl}/${route}` : siteUrl,
    lastModified: now,
    changeFrequency: route.startsWith('admin') ? 'monthly' : 'weekly',
    priority: route === '' ? 1 : route.startsWith('admin') ? 0.35 : 0.8
  }));
}
