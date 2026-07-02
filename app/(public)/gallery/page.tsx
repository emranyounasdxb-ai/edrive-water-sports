import type { Metadata } from 'next';
import { GalleryPage } from '@/components/edrive/public-pages';

export const metadata: Metadata = {
  title: 'Gallery'
};

export default function Page() {
  return <GalleryPage />;
}
