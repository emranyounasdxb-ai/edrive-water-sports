import type { Metadata } from 'next';
import { MembershipPage } from '@/components/edrive/membership-page';

export const metadata: Metadata = {
  title: 'eDrive Signature Membership Dubai',
  description: 'Discover eDrive Signature Membership benefits for repeat riders, Dubai residents, couples, families, private groups, and VIP guests.'
};

export default function Page() {
  return <MembershipPage />;
}
