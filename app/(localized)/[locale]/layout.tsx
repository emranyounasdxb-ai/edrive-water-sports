import type { ReactNode } from 'react';
import { Inter, Noto_Sans_Arabic } from 'next/font/google';
import { HeaderVisualFix } from '@/components/edrive/header-visual-fix';
import { PublicLocaleProvider } from '@/components/edrive/public-locale-provider';
import { PublicSeoSchema } from '@/components/edrive/public-seo-schema';
import { PublicShell } from '@/components/edrive/public-shell';
import { getPublicMessages } from '@/lib/i18n/get-messages';
import { localizedPublicLocales, requireLocalizedPublicLocale } from '@/lib/i18n/locales';
import '../../contact-cta.css';
import '../../hero-cta.css';
import '../../localized-public.css';

const arabic = Noto_Sans_Arabic({ subsets: ['arabic'], display: 'swap', variable: '--font-arabic', preload: false });
const russian = Inter({ subsets: ['cyrillic'], display: 'swap', variable: '--font-russian', preload: false });

export const dynamicParams = false;

export function generateStaticParams() {
  return localizedPublicLocales.map((locale) => ({ locale }));
}

export default async function LocalizedPublicLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const locale = requireLocalizedPublicLocale((await params).locale);
  const messages = getPublicMessages(locale);
  const fontClass = locale === 'ar' ? arabic.variable : russian.variable;

  return (
    <PublicLocaleProvider locale={locale} messages={messages.shared}>
      <div lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} data-public-locale={locale} className={fontClass}>
        <PublicShell><PublicSeoSchema locale={locale} /><HeaderVisualFix />{children}</PublicShell>
      </div>
    </PublicLocaleProvider>
  );
}
