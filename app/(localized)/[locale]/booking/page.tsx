import type { Metadata } from 'next';
import { BookingPage } from '@/components/edrive/public-pages';
import { getPublicMessages } from '@/lib/i18n/get-messages';
import { requireLocalizedPublicLocale } from '@/lib/i18n/locales';
import { createPublicMetadata } from '@/lib/i18n/metadata';

type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> { return createPublicMetadata(requireLocalizedPublicLocale((await params).locale), 'booking'); }
export default async function Page({ params }: Props) { const locale = requireLocalizedPublicLocale((await params).locale); const m = getPublicMessages(locale); return <BookingPage locale={locale} messages={m.routes.booking} bookingMessages={m.booking} packageMessages={m.packages} />; }
