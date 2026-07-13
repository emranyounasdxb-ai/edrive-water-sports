import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AdminShell } from '@/components/edrive/admin-shell';
import { PortalAccessProvider, PortalRoleBoundary } from '@/components/edrive/portal-access';
import { PortalLoadingRecovery } from '@/components/edrive/portal-loading-recovery';

export const metadata: Metadata = {
  title: 'Admin'
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <PortalAccessProvider>
      <PortalLoadingRecovery />
      <AdminShell>
        <PortalRoleBoundary>{children}</PortalRoleBoundary>
      </AdminShell>
    </PortalAccessProvider>
  );
}
