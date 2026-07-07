import type { Metadata } from 'next';
import { HomeExpansionSections } from '@/components/edrive/home-expansion';
import { LivePackageShowcase } from '@/components/edrive/live-package-showcase';
import { HomePage } from '@/components/edrive/public-pages';

export const metadata: Metadata = {
  title: 'Premium Jet Ski & Jet Car Experiences in Dubai',
  description: 'Premium Dubai water sports website for jet ski and jet car bookings, fleet, membership, and contact at Dubai Islands Marina.'
};

export default function Page() {
  return (
    <>
      <HomePage />
      <LivePackageShowcase title="Bookable Packages" text="Packages from the live booking system will appear here after the approved price list is added." limit={5} compact />
      <HomeExpansionSections />
    </>
  );
}
