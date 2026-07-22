import type { ReactNode } from 'react';
import { HeaderVisualFix } from '@/components/edrive/header-visual-fix';
import { PublicSeoSchema } from '@/components/edrive/public-seo-schema';
import { PublicShell } from '@/components/edrive/public-shell';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <PublicShell><PublicSeoSchema /><HeaderVisualFix />{children}</PublicShell>;
}
