import { AdminShell } from '@/features/admin/components/AdminShell';
import { AdminDashboardPage } from '@/features/admin/pages/AdminDashboardPage';

export default function Page() {
  return (
    <AdminShell>
      <AdminDashboardPage />
    </AdminShell>
  );
}
