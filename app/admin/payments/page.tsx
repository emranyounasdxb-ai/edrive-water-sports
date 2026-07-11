import type { Metadata } from 'next';
import { PaymentsRoutePage } from '@/components/edrive/payments-route-page';

export const metadata: Metadata = {
  title: 'Payments'
};

export default function Page() {
  return <PaymentsRoutePage />;
}
