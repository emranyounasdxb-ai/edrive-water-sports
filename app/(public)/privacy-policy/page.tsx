import type { Metadata } from 'next';
import { PolicyPage } from '@/components/edrive/policy-page';
import { companyInfo } from '@/lib/company-info';

export const metadata: Metadata = {
  title: 'Privacy Policy'
};

const sections = [
  {
    title: 'Information we collect',
    text: 'When you contact us or request a booking, we may collect your name, phone number, WhatsApp number, email address, preferred date and time, service selection, number of guests, and any notes you choose to share with our booking team.'
  },
  {
    title: 'How we use your information',
    text: 'We use your details to respond to inquiries, confirm availability, prepare booking instructions, manage customer support, improve our service quality, and communicate important updates related to your water sports experience.'
  },
  {
    title: 'Booking and communication channels',
    text: `Our team may contact you through phone, WhatsApp, or email using the official eDrive Water Sports contact details, including ${companyInfo.bookingEmail}, ${companyInfo.supportEmail}, ${companyInfo.landlineDisplay}, and ${companyInfo.whatsappDisplay}.`
  },
  {
    title: 'Payment and transaction information',
    text: 'If online or card payment options are used, payment information may be handled by the relevant payment provider. We only keep the booking and transaction details needed for confirmation, support, and record keeping.'
  },
  {
    title: 'Data protection',
    text: 'We take reasonable steps to keep customer information secure and limit access to team members who need the details for booking, support, operations, or customer service purposes.'
  },
  {
    title: 'Sharing of information',
    text: 'We do not sell customer personal information. We may share limited information only when needed for booking operations, payment processing, service delivery, legal requirements, or customer support.'
  },
  {
    title: 'Customer rights and contact',
    text: `For privacy questions, corrections, or deletion requests, please contact us at ${companyInfo.supportEmail}. We may need to verify your request before making changes to booking or customer records.`
  }
];

export default function Page() {
  return <PolicyPage label="Privacy" title="Privacy Policy" intro="This Privacy Policy explains how eDrive Water Sports collects, uses, and protects customer information when you visit our website, contact our team, or request a booking." sections={sections} />;
}
