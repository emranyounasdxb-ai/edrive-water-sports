import type { Metadata } from 'next';
import { AdminReportsPage } from '@/components/edrive/admin-pages';

export const metadata: Metadata = {
  title: 'Reports'
};

export default function Page() {
  return <AdminReportsPage />;
}
