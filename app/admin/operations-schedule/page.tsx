import type { Metadata } from 'next';
import { ManagerScopedSchedulePage } from '@/components/edrive/manager-schedule-page';

export const metadata: Metadata = {
  title: 'Schedule'
};

export default function Page() {
  return <ManagerScopedSchedulePage />;
}
