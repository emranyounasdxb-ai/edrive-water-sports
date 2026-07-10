import type { Metadata } from 'next';
import { AdminOperationsPaymentsPage } from '@/components/edrive/admin-operations-modules';

export const metadata: Metadata = {
  title: 'Payments'
};

export default function Page() {
  return <AdminOperationsPaymentsPage />;
}
