'use client';

import { createContext, useContext } from 'react';
import type { PublicLocale } from '@/lib/i18n/locales';
import type { PublicSharedMessages } from '@/lib/i18n/types';

type PublicLocaleContextValue = {
  locale: PublicLocale;
  messages: PublicSharedMessages;
};

const PublicLocaleContext = createContext<PublicLocaleContextValue | null>(null);

export function PublicLocaleProvider({ locale, messages, children }: PublicLocaleContextValue & { children: React.ReactNode }) {
  return <PublicLocaleContext.Provider value={{ locale, messages }}>{children}</PublicLocaleContext.Provider>;
}

export function usePublicLocale() {
  const value = useContext(PublicLocaleContext);
  if (!value) throw new Error('PublicLocaleProvider is required for public website components.');
  return value;
}
