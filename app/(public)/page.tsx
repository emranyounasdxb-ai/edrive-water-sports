import type { Metadata } from 'next';
import { HomeExpansionSections } from '@/components/edrive/home-expansion';
import { LivePackageShowcase } from '@/components/edrive/live-package-showcase';
import { HomePage } from '@/components/edrive/public-pages';

export const metadata: Metadata = {
  title: 'Premium Jet Ski & Jet Car Experiences in Dubai',
  description: 'Premium Dubai water sports website for jet ski rental Dubai, jet car rental Dubai, fleet, packages, membership, sales, and contact at Dubai Islands Marina.'
};

export default function Page() {
  return (
    <>
      <HomePage />
      <LivePackageShowcase title="Jet Car Packages" text="Popular active packages managed from the dashboard with B2C prices." limit={5} compact />
      <HomeExpansionSections />
    </>
  );
}
