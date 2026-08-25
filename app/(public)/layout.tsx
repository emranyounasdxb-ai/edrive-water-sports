import type { ReactNode } from 'react';
import { HeaderVisualFix } from '@/components/edrive/header-visual-fix';
import { PublicLocaleProvider } from '@/components/edrive/public-locale-provider';
import { PublicSeoSchema } from '@/components/edrive/public-seo-schema';
import { PublicShell } from '@/components/edrive/public-shell';
import { enMessages } from '@/lib/i18n/messages/en';
import '../contact-cta.css';
import '../hero-cta.css';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <PublicLocaleProvider locale="en" messages={enMessages.shared}><PublicShell><PublicSeoSchema locale="en" /><HeaderVisualFix />{children}</PublicShell></PublicLocaleProvider>;
}
