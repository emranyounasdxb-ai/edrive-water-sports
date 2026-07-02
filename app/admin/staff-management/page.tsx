import type { Metadata } from 'next';
import { AdminStaffPage } from '@/components/edrive/admin-pages';

export const metadata: Metadata = {
  title: 'Staff Management'
};

export default function Page() {
  return <AdminStaffPage />;
}
