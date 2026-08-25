import type { Metadata } from 'next';
import { BookingPage } from '@/components/edrive/public-pages';
import { createPublicMetadata } from '@/lib/i18n/metadata';

export const metadata: Metadata = createPublicMetadata('en', 'booking');

export default function Page() {
  return <BookingPage />;
}
