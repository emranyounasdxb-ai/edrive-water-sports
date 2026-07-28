import type { Metadata } from 'next';
import { ReportsRoutePage } from '@/components/edrive/reports-route-page';

export const metadata: Metadata = {
  title: 'Reports'
};

export default function Page() {
  return <ReportsRoutePage />;
}
