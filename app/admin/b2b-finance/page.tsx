import type { Metadata } from 'next';
import { AdminB2BFinancePage } from '@/components/edrive/admin-b2b-finance-page';

export const metadata: Metadata = { title: 'B2B Finance' };

export default function Page() {
  return <AdminB2BFinancePage />;
}
