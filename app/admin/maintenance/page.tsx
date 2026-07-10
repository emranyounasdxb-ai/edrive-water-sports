import type { Metadata } from 'next';
import { AdminMaintenanceLivePage } from '@/components/edrive/admin-business-modules';

export const metadata: Metadata = {
  title: 'Maintenance'
};

export default function Page() {
  return <AdminMaintenanceLivePage />;
}
