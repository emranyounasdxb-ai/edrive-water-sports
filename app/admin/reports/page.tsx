import { AdminShell } from '@/features/admin/components/AdminShell';
import { AdminSectionPage } from '@/features/admin/pages/AdminSectionPage';

export default function Page() {
  return (
    <AdminShell>
      <AdminSectionPage section="reports" />
    </AdminShell>
  );
}
