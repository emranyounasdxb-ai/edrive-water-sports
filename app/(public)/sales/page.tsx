import type { Metadata } from 'next';
import { SalesPage } from '@/components/edrive/public-pages';

export const metadata: Metadata = {
  title: 'Sales'
};

export default function Page() {
  return <SalesPage />;
}
