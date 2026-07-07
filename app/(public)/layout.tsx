import type { ReactNode } from 'react';
import { HeaderCtaStyles } from '@/components/edrive/header-cta-styles';
import { PublicShell } from '@/components/edrive/public-shell';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <PublicShell><HeaderCtaStyles />{children}</PublicShell>;
}
