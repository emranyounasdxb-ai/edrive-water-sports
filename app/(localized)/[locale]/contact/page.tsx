import type { Metadata } from 'next';
import { ContactPage } from '@/components/edrive/public-pages';
import { getPublicMessages } from '@/lib/i18n/get-messages';
import { requireLocalizedPublicLocale } from '@/lib/i18n/locales';
import { createPublicMetadata } from '@/lib/i18n/metadata';
import '../../../contact-page-polish.css';

type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> { return createPublicMetadata(requireLocalizedPublicLocale((await params).locale), 'contact'); }
export default async function Page({ params }: Props) { const locale = requireLocalizedPublicLocale((await params).locale); const m = getPublicMessages(locale); return <ContactPage locale={locale} messages={m.routes.contact} contactMessages={m.contactForm} bookNowLabel={m.common.bookNow} />; }
