import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AdminShell } from '@/components/edrive/admin-shell';
import { PortalAccessProvider, PortalRoleBoundary } from '@/components/edrive/portal-access';

export const metadata: Metadata = {
  title: 'Admin'
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <PortalAccessProvider>
      <AdminShell>
        <PortalRoleBoundary>{children}</PortalRoleBoundary>
      </AdminShell>
    </PortalAccessProvider>
  );
}
