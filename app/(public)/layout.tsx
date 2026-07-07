import type { ReactNode } from 'react';
import { PublicShellClean } from '@/components/edrive/public-shell-clean';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <PublicShellClean>{children}</PublicShellClean>;
}
