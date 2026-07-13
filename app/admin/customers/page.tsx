import type { Metadata } from 'next';
import { AdminCustomerHistoryPage } from '@/components/edrive/admin-customer-history-page';

export const metadata: Metadata = {
  title: 'Customers'
};

export default function Page() {
  return <AdminCustomerHistoryPage />;
}
