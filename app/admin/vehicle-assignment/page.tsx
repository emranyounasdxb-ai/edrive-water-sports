import type { Metadata } from 'next';
import { ManagerScopedAssignmentsPage } from '@/components/edrive/manager-my-rides-page';

export const metadata: Metadata = {
  title: 'Assignments'
};

export default function Page() {
  return <ManagerScopedAssignmentsPage />;
}
