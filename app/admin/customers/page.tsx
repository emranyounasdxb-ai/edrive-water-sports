import type { Metadata } from 'next';
import { AdminCustomersPage } from '@/components/edrive/admin-customers-page';

export const metadata: Metadata = {
  title: 'Customers'
};

export default function Page() {
  return <AdminCustomersPage />;
}
