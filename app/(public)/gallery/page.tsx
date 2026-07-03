import type { Metadata } from 'next';
import { LegacyRoutePage } from '@/components/edrive/public-pages';

export const metadata: Metadata = {
  title: 'Gallery',
  robots: { index: false, follow: true }
};

export default function Page() {
  return (
    <LegacyRoutePage
      title="Explore the Fleet Instead"
      text="The public website has been simplified. View the Fleet page for current ride types, premium visuals, and routes into rental packages."
      href="/fleet"
      cta="View Fleet"
    />
  );
}
