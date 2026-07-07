import type { Metadata } from 'next';
import { AdminBookingsLivePage } from '@/components/edrive/admin-bookings-page';

export const metadata: Metadata = {
  title: 'Bookings'
};

export default function Page() {
  return <AdminBookingsLivePage />;
}
