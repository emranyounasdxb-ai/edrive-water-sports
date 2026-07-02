import type { Metadata } from 'next';
import { AdminVehiclesPage } from '@/components/edrive/admin-pages';

export const metadata: Metadata = {
  title: 'Vehicles'
};

export default function Page() {
  return <AdminVehiclesPage />;
}
