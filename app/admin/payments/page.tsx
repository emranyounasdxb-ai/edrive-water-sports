import type { Metadata } from 'next';
import { AdminPaymentsPage } from '@/components/edrive/admin-payments-page';

export const metadata: Metadata = {
  title: 'Payments'
};

export default function Page() {
  return <AdminPaymentsPage />;
}
