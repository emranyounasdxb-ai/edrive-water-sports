import type { Metadata } from 'next';
import { AdminB2BAgentsPage } from '@/components/edrive/admin-pages';

export const metadata: Metadata = {
  title: 'B2B Agents'
};

export default function Page() {
  return <AdminB2BAgentsPage />;
}
