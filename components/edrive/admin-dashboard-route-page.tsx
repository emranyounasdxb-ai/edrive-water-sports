'use client';

import { AdminDashboardReconciledPage } from './admin-dashboard-reconciled-page';
import { BookingManagerDashboardPage } from './booking-manager-dashboard-page';
import { FinanceDashboardPage } from './finance-dashboard-page';
import { usePortalAccess } from './portal-access';
import { ContentAreaSkeleton } from './route-content-transition';

export function AdminDashboardRoutePage() {
  const { loading, isBookingManager, role } = usePortalAccess();
  if (loading) return <ContentAreaSkeleton label="Loading dashboard" cards={6} />;
  if (isBookingManager) return <BookingManagerDashboardPage />;
  if (role === 'finance') return <FinanceDashboardPage />;
  return <AdminDashboardReconciledPage />;
}
