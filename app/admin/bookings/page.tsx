import type { Metadata } from 'next';
import { AdminBookingsPage } from '@/components/edrive/admin-pages';

export const metadata: Metadata = {
  title: 'Bookings'
};

export default function Page() {
  return <AdminBookingsPage />;
}
