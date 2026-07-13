import type { Metadata } from 'next';
import { AdminReportsReconciledPage } from '@/components/edrive/admin-reports-reconciled-page';

export const metadata: Metadata = {
  title: 'Reports'
};

export default function Page() {
  return <AdminReportsReconciledPage />;
}
