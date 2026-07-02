import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

const siteUrl = 'https://edrivewatersports.ae';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: []
      }
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl
  };
}
