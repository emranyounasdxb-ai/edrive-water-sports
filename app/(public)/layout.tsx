import type { ReactNode } from 'react';
import { HeaderVisualFix } from '@/components/edrive/header-visual-fix';
import { PublicSeoSchema } from '@/components/edrive/public-seo-schema';
import { PublicShell } from '@/components/edrive/public-shell';
import '../contact-cta.css';
import '../hero-cta.css';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <PublicShell><PublicSeoSchema /><HeaderVisualFix />{children}</PublicShell>;
}
