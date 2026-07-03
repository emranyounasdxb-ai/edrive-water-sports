import type { Metadata } from 'next';
import { SalesPage } from '@/components/edrive/public-pages';

export const metadata: Metadata = {
  title: 'Jet Ski & Jet Car Sales in Dubai',
  description: 'Request current jet ski and jet car sales availability in Dubai through eDrive Water Sports, with inquiry-based support for new and pre-owned units.'
};

export default function Page() {
  return <SalesPage />;
}
