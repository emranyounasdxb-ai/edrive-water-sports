import type { Metadata } from 'next';
import { AdminAuditLogPage } from '@/components/edrive/admin-audit-log-page';

export const metadata: Metadata = {
  title: 'Audit Log'
};

export default function Page() {
  return <AdminAuditLogPage />;
}
