'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LockKeyhole, Mail, MapPin, Menu, MessageCircle, Phone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { companyInfo, whatsappUrl } from '@/lib/company-info';
import { localizeHref } from '@/lib/i18n/locales';
import { cn } from '@/lib/utils';
import { BrandMark } from './brand';
import { LanguageSwitcher } from './language-switcher';
import { usePublicLocale } from './public-locale-provider';
import styles from './public-shell.module.css';

const activeMenuClass = 'border-primary/18 bg-primary-100 text-primary-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-8px_14px_rgba(8,37,50,0.03),0_9px_20px_rgba(8,37,50,0.09)]';
const actionBaseClass = 'inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 text-[11px] font-bold leading-none transition-all duration-200 hover:-translate-y-0.5';
const staffActionClass = `${actionBaseClass} border border-amber-100 bg-[linear-gradient(145deg,#FFF6D9_0%,#FFFFFF_48%,#EAF8FA_100%)] text-primary-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.98),inset_0_-10px_18px_rgba(159,118,44,0.08),0_12px_26px_rgba(8,37,50,0.13),0_2px_5px_rgba(255,255,255,0.82)] hover:border-accent-300/70 hover:shadow-[inset_0_1px_0_rgba(255,255,255,1),inset_0_-10px_18px_rgba(159,118,44,0.11),0_16px_34px_rgba(8,37,50,0.18)]`;

function normalizePath(pathname: string) {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/$/, '');
}

export function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { locale, messages } = usePublicLocale();
  const currentPath = normalizePath(pathname);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navItems = [
    { href: '/', label: messages.home },
    { href: '/rentals', label: messages.rentals },
    { href: '/fleet', label: messages.fleet },
    { href: '/membership', label: messages.membership },
    { href: '/contact', label: messages.contact }
  ].map((item) => ({ ...item, href: localizeHref(locale, item.href) }));

  useEffect(() => {
    const updateHeader = () => setScrolled(window.scrollY > 32);
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
    return () => window.removeEventListener('scroll', updateHeader);
  }, []);

  return (
    <div className={cn(styles.shell, 'bg-background')}>
      <header className={styles.header} data-public-header>
        <nav className={cn(styles.headerNav, 'mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8')}>
          <div
            className={cn(
              styles.headerBar,
              'relative flex items-center justify-between gap-3 rounded-full px-4 ring-1 transition-all duration-300 ease-out',
              'shadow-[inset_0_1px_0_rgba(255,255,255,1),inset_0_-10px_22px_rgba(8,37,50,0.025),0_18px_42px_rgba(8,37,50,0.18),0_3px_8px_rgba(255,255,255,0.65)]',
              scrolled
                ? 'border border-white/90 bg-white/90 ring-black/5 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-10px_22px_rgba(8,37,50,0.025),0_14px_32px_rgba(8,37,50,0.12)]'
                : 'border border-white bg-white ring-black/5'
            )}
          >
            <Link href={localizeHref(locale, '/')} prefetch aria-label={messages.homeAria} className="z-10 flex shrink-0 items-center">
              <BrandMark className="[&_img]:h-9 [&_img]:w-auto" />
            </Link>

            <div className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 lg:flex">
              <div className="pointer-events-auto flex items-center justify-center gap-1">
                {navItems.map((item) => {
                  const active = currentPath === normalizePath(item.href);
                  return (
                    <Link key={item.href} href={item.href} prefetch aria-current={active ? 'page' : undefined} className={cn('inline-flex h-8 shrink-0 items-center justify-center whitespace-nowrap rounded-full border border-transparent bg-transparent px-3 text-center text-[11px] font-bold leading-none text-slate-700 transition-all duration-200 hover:text-primary-800 xl:px-4 xl:text-xs', active && activeMenuClass)}>
                      <span className="relative -top-px block leading-none">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="z-10 ml-auto hidden shrink-0 items-center gap-2 lg:flex">
              <LanguageSwitcher />
              <Link href="/admin" prefetch title={messages.staffLogin} aria-label={messages.staffLogin} className={cn(staffActionClass, 'size-9 px-0')}><LockKeyhole className="size-3.5" aria-hidden="true" /></Link>
            </div>

            <Button variant="outline" size="icon" className={cn('z-10 size-9 shrink-0 rounded-full lg:hidden', scrolled ? 'bg-white/90 backdrop-blur-sm' : 'bg-white')} onClick={() => setOpen((value) => !value)} aria-label={messages.toggleNavigation}>
              {open ? <X data-icon aria-hidden="true" /> : <Menu data-icon aria-hidden="true" />}
            </Button>
          </div>
        </nav>

        {open ? (
          <div className="mx-auto w-full max-w-7xl px-4 pt-3 sm:px-6 lg:px-8 lg:hidden">
            <div className="premium-surface flex flex-col gap-1 rounded-[1.5rem] p-3 shadow-[0_18px_45px_rgba(8,37,50,0.16)]">
              {navItems.map((item) => {
                const active = currentPath === normalizePath(item.href);
                return <Link key={item.href} href={item.href} prefetch onClick={() => setOpen(false)} aria-current={active ? 'page' : undefined} className={cn('inline-flex h-10 items-center justify-center whitespace-nowrap rounded-2xl px-4 text-sm font-bold text-muted-foreground transition hover:bg-white hover:text-foreground', active && activeMenuClass)}><span className="relative -top-px block leading-none">{item.label}</span></Link>;
              })}
              <div className="mt-2"><LanguageSwitcher mobile onSelect={() => setOpen(false)} /></div>
              <div className="mt-3">
                <Link href="/admin" onClick={() => setOpen(false)} className={staffActionClass}><LockKeyhole className="size-3.5" aria-hidden="true" /><span>{messages.staffLogin}</span></Link>
              </div>
            </div>
          </div>
        ) : null}
      </header>

      <main className={styles.main} data-public-main>
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}

function PublicFooter() {
  const { locale, messages } = usePublicLocale();
  const navItems = [
    { href: '/', label: messages.home }, { href: '/rentals', label: messages.rentals }, { href: '/fleet', label: messages.fleet }, { href: '/membership', label: messages.membership }, { href: '/contact', label: messages.contact }
  ];
  const policyLinks = [
    { href: '/privacy-policy', label: messages.privacyPolicy },
    { href: '/terms-and-conditions', label: messages.terms },
    { href: '/refund-replacement-policy', label: messages.refundPolicy }
  ];
  return (
    <footer className="border-t border-border bg-white">
      <div className="container-x grid gap-10 py-12 md:grid-cols-[1.2fr_0.7fr_1fr]">
        <div className="flex flex-col gap-5">
          <BrandMark />
          <p className="max-w-sm text-sm leading-7 text-muted-foreground">{messages.footerIntro}</p>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100" aria-label={messages.whatsappAria}><MessageCircle className="size-4" aria-hidden="true" />{messages.whatsappLabel}</a>
        </div>
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-foreground">{messages.explore}</h3>
          {navItems.filter((item) => item.href !== '/rentals').map((item) => <Link key={item.href} href={localizeHref(locale, item.href)} className="text-sm text-muted-foreground transition hover:text-primary">{item.label}</Link>)}
          <Link href={localizeHref(locale, '/rentals')} className="text-sm text-muted-foreground transition hover:text-primary">{messages.allRentals}</Link>
          <Link href={localizeHref(locale, '/jet-ski-rentals')} className="text-sm text-muted-foreground transition hover:text-primary">{messages.jetSkiRentals}</Link>
          <Link href={localizeHref(locale, '/jet-car-rentals')} className="text-sm text-muted-foreground transition hover:text-primary">{messages.jetCarRentals}</Link>
          <Link href={localizeHref(locale, '/booking')} className="text-sm text-muted-foreground transition hover:text-primary">{messages.bookRide}</Link>
          <Link href={localizeHref(locale, '/my-booking')} prefetch className="text-sm text-muted-foreground transition hover:text-primary">{messages.trackMyBooking}</Link>
        </div>
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-foreground">{messages.contact}</h3>
          <a href={`tel:${companyInfo.landlineHref}`} className="flex items-center gap-3 text-sm text-muted-foreground transition hover:text-primary"><Phone data-icon aria-hidden="true" />{companyInfo.landlineDisplay}</a>
          <a href={`mailto:${companyInfo.bookingEmail}`} className="flex items-center gap-3 text-sm text-muted-foreground transition hover:text-primary"><Mail data-icon aria-hidden="true" />{companyInfo.bookingEmail}</a>
          <p className="flex items-center gap-3 text-sm text-muted-foreground"><MapPin data-icon aria-hidden="true" />{companyInfo.locationName}</p>
        </div>
      </div>
      <div className="waterline border-t border-border py-5">
        <div className="container-x flex flex-col justify-between gap-4 text-xs text-muted-foreground lg:flex-row lg:items-center">
          <span>{messages.rights}</span>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {policyLinks.map((item, index) => <span key={item.href} className="inline-flex items-center gap-3">{index > 0 ? <span className="text-border">|</span> : null}<Link href={localizeHref(locale, item.href)} className="font-semibold transition hover:text-primary">{item.label}</Link></span>)}
          </div>
          <Link href={localizeHref(locale, '/booking')} className="inline-flex items-center gap-2 font-semibold text-primary">{messages.bookYourRide}</Link>
        </div>
      </div>
    </footer>
  );
}
