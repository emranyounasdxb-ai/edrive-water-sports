'use client';

import { AdminReportsReconciledPage } from './admin-reports-reconciled-page';
import { FinanceReportsPage } from './finance-reports-page';
import { usePortalAccess } from './portal-access';
import { ContentAreaSkeleton } from './route-content-transition';

export function ReportsRoutePage() {
  const { loading, role } = usePortalAccess();
  if (loading) return <ContentAreaSkeleton label="Loading reports" cards={4} />;
  return role === 'finance' ? <FinanceReportsPage /> : <AdminReportsReconciledPage />;
}
