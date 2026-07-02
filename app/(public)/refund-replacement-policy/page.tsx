import type { Metadata } from 'next';
import { PolicyPage } from '@/components/edrive/policy-page';
import { companyInfo } from '@/lib/company-info';

export const metadata: Metadata = {
  title: 'Refund / Replacement Policy'
};

const sections = [
  {
    title: 'General policy',
    text: 'Refunds, replacements, rescheduling, or credits depend on the booking type, payment status, timing of the request, service availability, and the reason for the change. Our team reviews each request based on the confirmed booking details.'
  },
  {
    title: 'Weather or safety changes',
    text: 'If a booking cannot proceed because of weather, marine conditions, safety requirements, or operational restrictions, eDrive Water Sports may offer a replacement slot, rescheduling option, alternative service, or another suitable solution.'
  },
  {
    title: 'Customer change requests',
    text: 'Customers should contact us as early as possible for date, time, guest count, or service changes. Requests made close to the confirmed booking time may be limited by availability and operational scheduling.'
  },
  {
    title: 'Late arrival or no-show',
    text: 'If a customer arrives late, the ride time may be reduced or the booking may need to be rescheduled depending on availability. No-show bookings may not be eligible for refund or replacement unless approved by management.'
  },
  {
    title: 'Replacement service',
    text: 'When the originally booked craft or service is unavailable, we may offer a suitable replacement craft, similar ride, alternative time slot, or service credit based on availability and customer approval.'
  },
  {
    title: 'Refund processing',
    text: 'Approved refunds are processed through the original or agreed payment method where possible. Processing time may depend on the payment provider, bank, or internal review requirements.'
  },
  {
    title: 'How to request support',
    text: `For refund, replacement, or rescheduling support, contact ${companyInfo.bookingEmail}, call ${companyInfo.landlineDisplay}, or message us on WhatsApp at ${companyInfo.whatsappDisplay}. Please include your name, booking date, service type, and reason for the request.`
  }
];

export default function Page() {
  return <PolicyPage label="Refunds" title="Refund / Replacement Policy" intro="This policy explains how eDrive Water Sports handles refund, replacement, rescheduling, and service change requests for bookings and customer experiences." sections={sections} />;
}
