import type { Metadata } from 'next';
import { AdminB2BAgentsPolishedPage } from '@/components/edrive/admin-b2b-agents-polished-page';

export const metadata: Metadata = {
  title: 'B2B Agents'
};

export default function Page() {
  return <AdminB2BAgentsPolishedPage />;
}
