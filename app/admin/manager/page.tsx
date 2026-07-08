import type { Metadata } from 'next';
import { ManagerBookingsPage } from '@/components/edrive/manager-bookings-page';

export const metadata: Metadata = { title: 'Manager / Operations' };

export default function Page() {
  return <ManagerBookingsPage />;
}
