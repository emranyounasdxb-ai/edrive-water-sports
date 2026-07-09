import type { Metadata } from 'next';
import { AdminB2BAgentsCleanPage } from '@/components/edrive/admin-b2b-agents-page';

export const metadata: Metadata = {
  title: 'B2B Agents'
};

export default function Page() {
  return <AdminB2BAgentsCleanPage />;
}
