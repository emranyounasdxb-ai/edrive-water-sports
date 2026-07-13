'use client';

import { AdminDashboardReconciledPage } from './admin-dashboard-reconciled-page';
import { BookingManagerDashboardPage } from './booking-manager-dashboard-page';
import { usePortalAccess } from './portal-access';

export function AdminDashboardRoutePage() {
  const { loading, isBookingManager } = usePortalAccess();
  if (loading) return <div className="p-6 text-sm font-semibold text-muted-foreground">Loading dashboard...</div>;
  if (isBookingManager) return <BookingManagerDashboardPage />;
  return <AdminDashboardReconciledPage />;
}
