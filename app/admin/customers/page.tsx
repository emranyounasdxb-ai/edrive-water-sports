import type { Metadata } from 'next';
import { AdminCustomersLivePage } from '@/components/edrive/admin-business-modules';

export const metadata: Metadata = {
  title: 'Customers'
};

export default function Page() {
  return <AdminCustomersLivePage />;
}
