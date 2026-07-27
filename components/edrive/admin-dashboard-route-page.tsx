'use client';

import { AdminDashboardReconciledPage } from './admin-dashboard-reconciled-page';
import { BookingManagerDashboardPage } from './booking-manager-dashboard-page';
import { usePortalAccess } from './portal-access';
import { ContentAreaSkeleton } from './route-content-transition';

export function AdminDashboardRoutePage() {
  const { loading, isBookingManager } = usePortalAccess();
  if (loading) return <ContentAreaSkeleton label="Loading dashboard" cards={6} />;
  if (isBookingManager) return <BookingManagerDashboardPage />;
  return <AdminDashboardReconciledPage />;
}
