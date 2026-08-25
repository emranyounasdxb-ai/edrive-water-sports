import type { Metadata } from 'next';
import { FleetPage } from '@/components/edrive/public-pages';
import { createPublicMetadata } from '@/lib/i18n/metadata';
import '../../fleet-image-polish.css';

export const metadata: Metadata = createPublicMetadata('en', 'fleet');

export default function Page() {
  return <FleetPage />;
}
