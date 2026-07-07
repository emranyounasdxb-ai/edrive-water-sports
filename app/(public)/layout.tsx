import type { ReactNode } from 'react';
import { HeaderActionRefiner } from '@/components/edrive/header-action-refiner';
import { PublicShell } from '@/components/edrive/public-shell';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <PublicShell><HeaderActionRefiner />{children}</PublicShell>;
}
