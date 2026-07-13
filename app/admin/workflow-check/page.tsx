import type { Metadata } from 'next';
import { AdminWorkflowCheckPage } from '@/components/edrive/admin-workflow-check-page';

export const metadata: Metadata = {
  title: 'Workflow Check'
};

export default function Page() {
  return <AdminWorkflowCheckPage />;
}
