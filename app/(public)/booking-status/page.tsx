import type { Metadata } from 'next';
import { BookingStatusChecker } from '@/components/edrive/booking-status-checker';

export const metadata: Metadata = {
  title: 'Check Booking Status',
  description: 'Check your eDrive Water Sports booking request status using your booking reference number.'
};

export default function Page() {
  return <BookingStatusChecker />;
}
