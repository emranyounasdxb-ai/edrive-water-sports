import type { Metadata } from 'next';
import { CalendarCheck, MessageCircle } from 'lucide-react';
import { LivePackageShowcase } from '@/components/edrive/live-package-showcase';
import { PublicVideoHero } from '@/components/edrive/public-video-hero';
import { whatsappUrl } from '@/lib/company-info';
import { getPublicMessages } from '@/lib/i18n/get-messages';
import { localizeHref, requireLocalizedPublicLocale } from '@/lib/i18n/locales';
import { createPublicMetadata } from '@/lib/i18n/metadata';
import { jetSkiLightImage } from '@/lib/mock-data';

type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> { return createPublicMetadata(requireLocalizedPublicLocale((await params).locale), 'jetSki'); }
export default async function Page({ params }: Props) { const locale = requireLocalizedPublicLocale((await params).locale); const m = getPublicMessages(locale); const route = m.routes.jetSki; return <><PublicVideoHero title={route.heroTitle!} text={route.heroText!} fallbackImage={jetSkiLightImage} fallbackAlt={route.heroAlt!} actions={[{ href: localizeHref(locale, '/booking'), label: m.common.bookRide, icon: CalendarCheck }, { href: whatsappUrl, label: m.common.whatsappTeam, icon: MessageCircle, variant: 'gold', external: true }]} /><LivePackageShowcase title={route.packageTitle} text={route.packageText} categories={['jet_ski_rental']} sortByDuration locale={locale} messages={m.packages} /></>; }
