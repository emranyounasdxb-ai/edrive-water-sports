import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AdminShell } from '@/components/edrive/admin-shell';
import { PortalAccessProvider, PortalRoleBoundary } from '@/components/edrive/portal-access';
import { PortalLoadingRecovery } from '@/components/edrive/portal-loading-recovery';
import { TopbarProfileMenu } from '@/components/edrive/topbar-profile-menu';
import '../manager-app-polish.css';

export const metadata: Metadata = {
  title: 'Admin',
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true
    }
  }
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <PortalAccessProvider>
      <PortalLoadingRecovery />
      <TopbarProfileMenu />
      <AdminShell>
        <PortalRoleBoundary>{children}</PortalRoleBoundary>
      </AdminShell>
    </PortalAccessProvider>
  );
}
