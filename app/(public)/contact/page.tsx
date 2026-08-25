import type { Metadata } from 'next';
import { ContactPage } from '@/components/edrive/public-pages';
import { createPublicMetadata } from '@/lib/i18n/metadata';
import '../../contact-page-polish.css';

export const metadata: Metadata = createPublicMetadata('en', 'contact');

export default function Page() {
  return <ContactPage />;
}
