import type { Metadata } from 'next';
import { LegacyRoutePage } from '@/components/edrive/public-pages';

export const metadata: Metadata = {
  title: 'About eDrive',
  robots: { index: false, follow: true }
};

export default function Page() {
  return (
    <LegacyRoutePage
      title="eDrive Water Sports"
      text="Our public website has been simplified. Start from Home for the premium Dubai water sports overview, or explore Rentals for package-led booking."
      href="/"
      cta="Go to Home"
    />
  );
}
