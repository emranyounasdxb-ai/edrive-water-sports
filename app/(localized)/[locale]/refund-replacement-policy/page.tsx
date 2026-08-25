import type { Metadata } from 'next';
import { PolicyPage } from '@/components/edrive/policy-page';
import { getPublicMessages } from '@/lib/i18n/get-messages';
import { requireLocalizedPublicLocale } from '@/lib/i18n/locales';
import { createPublicMetadata } from '@/lib/i18n/metadata';

type Props = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> { return createPublicMetadata(requireLocalizedPublicLocale((await params).locale), 'refund'); }
export default async function Page({ params }: Props) { const locale = requireLocalizedPublicLocale((await params).locale); return <PolicyPage {...getPublicMessages(locale).policies.refund} />; }
