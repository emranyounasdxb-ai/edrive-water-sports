import type { Metadata } from 'next';
import { AdminSettingsLivePage } from '@/components/edrive/admin-business-modules';

export const metadata: Metadata = {
  title: 'Settings'
};

export default function Page() {
  return <AdminSettingsLivePage />;
}
