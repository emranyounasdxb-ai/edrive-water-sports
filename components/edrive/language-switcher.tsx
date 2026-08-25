'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Languages } from 'lucide-react';
import { publicLocales, switchLocalePath } from '@/lib/i18n/locales';
import { cn } from '@/lib/utils';
import { usePublicLocale } from './public-locale-provider';

const labels = { en: 'EN', ar: 'العربية', ru: 'RU' } as const;

export function LanguageSwitcher({ mobile = false, onSelect }: { mobile?: boolean; onSelect?: () => void }) {
  const pathname = usePathname();
  const { locale, messages } = usePublicLocale();

  return (
    <div className={cn('flex items-center rounded-full border border-primary/15 bg-white/90 p-1 shadow-sm', mobile ? 'w-full justify-center' : 'shrink-0')} aria-label={messages.selectLanguage} role="group">
      <Languages className="mx-1 size-3.5 shrink-0 text-primary" aria-hidden="true" />
      {publicLocales.map((item) => (
        <Link
          key={item}
          href={switchLocalePath(pathname, item)}
          hrefLang={item}
          lang={item}
          dir={item === 'ar' ? 'rtl' : 'ltr'}
          aria-current={item === locale ? 'page' : undefined}
          aria-label={`${messages.language}: ${labels[item]}`}
          onClick={onSelect}
          className={cn('inline-flex h-7 items-center justify-center rounded-full px-2 text-[10px] font-bold text-slate-600 transition hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary', item === locale && 'bg-primary-900 text-white hover:bg-primary-800')}
        >
          {labels[item]}
        </Link>
      ))}
    </div>
  );
}
