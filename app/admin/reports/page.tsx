import type { Metadata } from 'next';
import { AdminReportsLivePage } from '@/components/edrive/admin-business-modules';

export const metadata: Metadata = {
  title: 'Reports'
};

export default function Page() {
  return <AdminReportsLivePage />;
}
