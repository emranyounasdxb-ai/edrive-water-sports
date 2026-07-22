import { companyInfo } from '@/lib/company-info';

export function PublicSeoSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'SportsActivityLocation'],
    '@id': 'https://edrivedubai.ae/#business',
    name: 'eDrive Water Sports',
    url: 'https://edrivedubai.ae/',
    image: 'https://edrivedubai.ae/brand/og-image.png',
    logo: 'https://edrivedubai.ae/brand/icon-512.png',
    description: 'Premium jet ski rental and jet car rides from Dubai Islands with booking support, safety briefing, and marine operations assistance.',
    telephone: companyInfo.landlineDisplay,
    email: companyInfo.bookingEmail,
    priceRange: 'AED',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Dubai',
      addressRegion: 'Dubai',
      addressCountry: 'AE',
      streetAddress: companyInfo.locationAddress
    },
    areaServed: {
      '@type': 'City',
      name: 'Dubai'
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Water Sports Experiences',
      itemListElement: [
        { '@type': 'OfferCatalog', name: 'Jet Ski Rental Dubai' },
        { '@type': 'OfferCatalog', name: 'Jet Car Rides Dubai' },
        { '@type': 'OfferCatalog', name: 'Water Sports Membership' }
      ]
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: companyInfo.landlineDisplay,
        contactType: 'customer service',
        areaServed: 'AE',
        availableLanguage: ['English', 'Arabic', 'Urdu']
      }
    ]
  };

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': 'https://edrivedubai.ae/#website',
    url: 'https://edrivedubai.ae/',
    name: 'eDrive Water Sports',
    publisher: { '@id': 'https://edrivedubai.ae/#business' }
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }} />
    </>
  );
}
