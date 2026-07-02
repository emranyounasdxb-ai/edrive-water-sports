import type { Metadata } from 'next';
import { AdminInventoryPage } from '@/components/edrive/admin-pages';

export const metadata: Metadata = {
  title: 'Inventory'
};

export default function Page() {
  return <AdminInventoryPage />;
}
