import type { Metadata } from 'next';
import { ManagerOperationsPage } from '@/components/edrive/admin-pages';

export const metadata: Metadata = { title: 'Manager / Operations' };

export default function Page() {
  return <ManagerOperationsPage />;
}
