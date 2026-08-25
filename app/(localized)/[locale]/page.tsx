import type { Metadata } from 'next';
import { HomePage } from '@/components/edrive/home-page';
import { getPublicMessages } from '@/lib/i18n/get-messages';
import { requireLocalizedPublicLocale } from '@/lib/i18n/locales';
import { createPublicMetadata } from '@/lib/i18n/metadata';
import '../../home-responsive.css';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return createPublicMetadata(requireLocalizedPublicLocale((await params).locale), 'home');
}

export default async function Page({ params }: Props) {
  const locale = requireLocalizedPublicLocale((await params).locale);
  return <HomePage locale={locale} messages={getPublicMessages(locale).home} />;
}
