import type { Metadata } from 'next';
import { TeamAccessRolePage } from '@/components/edrive/team-access-role-page';

export const metadata: Metadata = {
  title: 'Team & Access'
};

export default function Page() {
  return <TeamAccessRolePage />;
}
