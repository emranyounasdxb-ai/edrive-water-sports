import type { Metadata } from 'next';
import { PolicyPage } from '@/components/edrive/policy-page';
import { companyInfo } from '@/lib/company-info';

export const metadata: Metadata = {
  title: 'Terms & Conditions'
};

const sections = [
  {
    title: 'Use of our website and services',
    text: 'By using the eDrive Water Sports website, contacting our team, or making a booking request, you agree to use our services responsibly and provide accurate information for booking, safety, and customer support purposes.'
  },
  {
    title: 'Booking confirmation',
    text: 'Submitting a booking request does not automatically confirm availability. A booking is confirmed only after our team verifies the selected service, time slot, guest details, payment status when applicable, and operational conditions.'
  },
  {
    title: 'Customer responsibility',
    text: 'Customers must follow safety instructions, staff guidance, marina rules, and any instructions given before, during, and after the ride. Customers are responsible for arriving on time and sharing accurate contact details.'
  },
  {
    title: 'Safety and weather conditions',
    text: 'All rides are subject to weather, marine conditions, safety checks, government instructions, and operational availability. eDrive Water Sports may delay, reschedule, replace, or cancel an activity when needed for safety or operational reasons.'
  },
  {
    title: 'Pricing and payment',
    text: 'Prices, packages, and promotional offers may change depending on service type, duration, availability, and season. Any final payment amount will be confirmed by our booking team before the experience is completed.'
  },
  {
    title: 'Late arrival and no-show',
    text: 'Late arrival may reduce ride duration or affect the confirmed time slot. A no-show or failure to arrive within the agreed time may result in cancellation according to the applicable booking and refund policy.'
  },
  {
    title: 'Contact details',
    text: `For booking support, please contact ${companyInfo.bookingEmail}, call ${companyInfo.landlineDisplay}, or message us on WhatsApp at ${companyInfo.whatsappDisplay}. Our main location is ${companyInfo.locationName}.`
  }
];

export default function Page() {
  return <PolicyPage label="Terms" title="Terms & Conditions" intro="These Terms & Conditions explain the general rules for using the eDrive Water Sports website, making booking requests, and using our water sports services." sections={sections} />;
}
