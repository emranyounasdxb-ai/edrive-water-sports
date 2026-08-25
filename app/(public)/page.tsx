import type { Metadata } from 'next';
import { HomePage } from '@/components/edrive/home-page';
import { createPublicMetadata } from '@/lib/i18n/metadata';
import '../home-responsive.css';

export const metadata: Metadata = createPublicMetadata('en', 'home');

export default function Page() {
  return <HomePage />;
}
