import type { Metadata } from 'next';
import { PublicBookingTracker } from '@/components/edrive/public-booking-tracker';
import { getPublicMessages } from '@/lib/i18n/get-messages';
import { requireLocalizedPublicLocale } from '@/lib/i18n/locales';
import { createPublicMetadata } from '@/lib/i18n/metadata';

type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> { return createPublicMetadata(requireLocalizedPublicLocale((await params).locale), 'myBooking'); }
export default async function Page({ params }: Props) { const locale = requireLocalizedPublicLocale((await params).locale); return <PublicBookingTracker locale={locale} messages={getPublicMessages(locale).tracker} />; }
