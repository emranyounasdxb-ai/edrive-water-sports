import { companyInfo } from '@/lib/company-info';
import { getPublicMessages } from '@/lib/i18n/get-messages';
import { publicUrl, type PublicLocale } from '@/lib/i18n/locales';

export function PublicSeoSchema({ locale = 'en' }: { locale?: PublicLocale }) {
  const messages = getPublicMessages(locale);
  const languageNames = locale === 'ar' ? ['العربية', 'English', 'Русский'] : locale === 'ru' ? ['Русский', 'English', 'العربية'] : ['English', 'Arabic', 'Russian'];
  const schema = {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'SportsActivityLocation'],
    '@id': 'https://edrivedubai.ae/#business',
    name: 'eDrive Water Sports',
    url: publicUrl(locale),
    image: 'https://edrivedubai.ae/brand/og-image.png',
    logo: 'https://edrivedubai.ae/brand/icon-512.png',
    description: messages.routes.home.description,
    inLanguage: locale,
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
      name: messages.home.experiencesTitle,
      itemListElement: [
        { '@type': 'OfferCatalog', name: messages.routes.jetSki.title },
        { '@type': 'OfferCatalog', name: messages.routes.jetCar.title },
        { '@type': 'OfferCatalog', name: messages.routes.membership.title }
      ]
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: companyInfo.landlineDisplay,
        contactType: 'customer service',
        areaServed: 'AE',
        availableLanguage: languageNames
      }
    ]
  };

  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': 'https://edrivedubai.ae/#website',
    url: publicUrl(locale),
    name: 'eDrive Water Sports',
    inLanguage: locale,
    publisher: { '@id': 'https://edrivedubai.ae/#business' }
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }} />
    </>
  );
}
