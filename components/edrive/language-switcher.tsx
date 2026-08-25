'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Languages } from 'lucide-react';
import { publicLocales, switchLocalePath } from '@/lib/i18n/locales';
import { cn } from '@/lib/utils';
import { usePublicLocale } from './public-locale-provider';

const codes = { en: 'EN', ar: 'AR', ru: 'RU' } as const;
const labels = { en: 'English', ar: 'العربية', ru: 'Русский' } as const;

export function LanguageSwitcher({ mobile = false, onSelect }: { mobile?: boolean; onSelect?: () => void }) {
  const pathname = usePathname();
  const { locale, messages } = usePublicLocale();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn('relative', mobile ? 'w-full' : 'shrink-0')}>
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-haspopup="menu" aria-label={messages.selectLanguage} className={cn('flex h-9 items-center justify-center gap-1.5 rounded-full border border-primary/15 bg-white/90 px-3 text-[11px] font-bold text-slate-700 shadow-sm transition hover:border-primary/25 hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary', mobile && 'w-full')}>
        <Languages className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
        <span>{codes[locale]}</span>
        <ChevronDown className={cn('size-3.5 transition-transform', open && 'rotate-180')} aria-hidden="true" />
      </button>
      {open ? (
        <div role="menu" aria-label={messages.selectLanguage} className={cn('absolute top-full z-50 mt-2 min-w-40 overflow-hidden rounded-2xl border border-primary/10 bg-white p-1.5 shadow-[0_16px_36px_rgba(8,37,50,0.18)]', locale === 'ar' ? 'left-0' : 'right-0', mobile && 'left-1/2 right-auto -translate-x-1/2')}>
          {publicLocales.map((item) => (
            <Link key={item} href={switchLocalePath(pathname, item)} hrefLang={item} lang={item} dir={item === 'ar' ? 'rtl' : 'ltr'} role="menuitem" aria-current={item === locale ? 'page' : undefined} onClick={() => { setOpen(false); onSelect?.(); }} className={cn('flex h-10 items-center justify-between gap-4 rounded-xl px-3 text-sm font-semibold text-slate-700 transition hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary', item === locale && 'bg-primary-50 text-primary-900')}>
              <span>{labels[item]}</span>
              {item === locale ? <Check className="size-4 text-primary" aria-hidden="true" /> : null}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
