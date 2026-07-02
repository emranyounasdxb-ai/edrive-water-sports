import { siteConfig } from '@/config/site';

export const dynamic = 'force-static';

const routes = ['', '/about', '/jet-ski-rentals', '/jet-car-rentals', '/sales', '/booking', '/gallery', '/contact'];

export default function sitemap() {
  return routes.map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: new Date('2026-01-01'),
    changeFrequency: route === '' ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : 0.8,
  }));
}
