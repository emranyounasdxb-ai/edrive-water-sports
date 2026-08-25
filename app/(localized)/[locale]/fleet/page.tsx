import type { Metadata } from 'next';
import { FleetPage } from '@/components/edrive/public-pages';
import { getPublicMessages } from '@/lib/i18n/get-messages';
import { requireLocalizedPublicLocale } from '@/lib/i18n/locales';
import { createPublicMetadata } from '@/lib/i18n/metadata';
import '../../../fleet-image-polish.css';

type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> { return createPublicMetadata(requireLocalizedPublicLocale((await params).locale), 'fleet'); }
export default async function Page({ params }: Props) { const locale = requireLocalizedPublicLocale((await params).locale); const m = getPublicMessages(locale); return <FleetPage locale={locale} messages={m.routes.fleet} fleetMessages={m.fleet} />; }
