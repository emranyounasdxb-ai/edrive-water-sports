import type { Metadata } from 'next';
import { AdminBookingWorkflowPage } from '@/components/edrive/admin-booking-workflow-page';

export const metadata: Metadata = {
  title: 'Bookings'
};

export default function Page() {
  return <AdminBookingWorkflowPage />;
}
