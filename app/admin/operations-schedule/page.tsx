import type { Metadata } from 'next';
import { AdminOperationsSchedulePage } from '@/components/edrive/admin-operations-modules';

export const metadata: Metadata = {
  title: 'Schedule'
};

export default function Page() {
  return <AdminOperationsSchedulePage />;
}
