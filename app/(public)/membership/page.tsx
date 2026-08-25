import type { Metadata } from 'next';
import { MembershipPage } from '@/components/edrive/membership-page';
import { createPublicMetadata } from '@/lib/i18n/metadata';

export const metadata: Metadata = createPublicMetadata('en', 'membership');

export default function Page() {
  return <MembershipPage />;
}
