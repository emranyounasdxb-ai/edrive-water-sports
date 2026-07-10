import type { Metadata } from 'next';
import { AdminMaintenancePage } from '@/components/edrive/admin-maintenance-page';

export const metadata: Metadata = {
  title: 'Maintenance'
};

export default function Page() {
  return <AdminMaintenancePage />;
}
