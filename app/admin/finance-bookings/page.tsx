import type { Metadata } from 'next';
import { FinanceBookingsPage } from '@/components/edrive/finance-bookings-page';

export const metadata: Metadata = { title: 'Financial Bookings' };

export default function Page() {
  return <FinanceBookingsPage />;
}
