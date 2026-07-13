import type { Metadata } from 'next';
import { TeamAccessPage } from '@/components/edrive/team-access-page';

export const metadata: Metadata = {
  title: 'Team & Access'
};

export default function Page() {
  return <TeamAccessPage />;
}
