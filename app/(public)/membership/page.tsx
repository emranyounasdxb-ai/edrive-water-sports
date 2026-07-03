import type { Metadata } from 'next';
import { MembershipPage } from '@/components/edrive/public-pages';

export const metadata: Metadata = {
  title: 'eDrive Water Sports Membership',
  description: 'Request eDrive Water Sports membership benefits for repeat riders, Dubai residents, couples, families, and VIP guests booking Dubai marine experiences.'
};

export default function Page() {
  return <MembershipPage />;
}
