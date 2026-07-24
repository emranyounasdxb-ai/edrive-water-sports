import type { Metadata } from 'next';
import { FleetPage } from '@/components/edrive/public-pages';

export const metadata: Metadata = {
  title: 'Jet Ski & Jet Car Fleet Dubai',
  description: 'Explore individual eDrive Jet Ski and Jet Car fleet units at Dubai Islands with original vehicle images, seating details, and direct package access.'
};

export default function Page() {
  return <FleetPage />;
}
