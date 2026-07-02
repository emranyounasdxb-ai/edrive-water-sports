import type { Metadata } from 'next';
import { AdminCouponsPage } from '@/components/edrive/admin-pages';

export const metadata: Metadata = {
  title: 'Coupons'
};

export default function Page() {
  return <AdminCouponsPage />;
}
