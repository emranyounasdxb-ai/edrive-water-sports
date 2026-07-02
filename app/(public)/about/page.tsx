import type { Metadata } from 'next';
import { AboutPage } from '@/components/edrive/public-pages';

export const metadata: Metadata = {
  title: 'About'
};

export default function Page() {
  return <AboutPage />;
}
