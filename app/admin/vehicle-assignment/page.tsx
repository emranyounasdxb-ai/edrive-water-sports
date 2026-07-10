import type { Metadata } from 'next';
import { AdminOperationsAssignmentsPage } from '@/components/edrive/admin-operations-modules';

export const metadata: Metadata = {
  title: 'Assignments'
};

export default function Page() {
  return <AdminOperationsAssignmentsPage />;
}
