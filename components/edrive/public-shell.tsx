'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, CalendarCheck, Instagram, LockKeyhole, Mail, MapPin, Menu, Phone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { companyInfo } from '@/lib/company-info';
import { publicNavItems } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { BrandMark } from './brand';

const activeMenuClass = 'bg-primary-100 text-primary-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_7px_18px_rgba(8,37,50,0.08)]';

const policyLinks = [
  { href: '/privacy-policy', label: 'Privacy Policy' },
  { href: '/terms-and-conditions', label: 'Terms & Conditions' },
  { href: '/refund-replacement-policy', label: 'Refund / Replacement Policy' }
];

function normalizePath(pathname: string) {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/$/, '');
}

export function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentPath = normalizePath(pathname);
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-hidden bg-background">
      <header className="fixed inset-x-0 top-0 z-[90] py-3">
        <nav className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-[48px] items-center justify-between gap-3 rounded-full border border-white/90 bg-white/88 px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-1px_0_rgba(8,37,50,0.04),0_18px_48px_rgba(8,37,50,0.16)] ring-1 ring-primary-900/5 backdrop-blur-2xl">
            <Link href="/" aria-label="eDrive Water Sports home" className="flex shrink-0 items-center">
              <BrandMark className="[&_img]:h-9 [&_img]:w-auto" />
            </Link>

            <div className="hidden min-w-0 flex-1 items-center justify-center lg:flex">
              <div className="flex items-center gap-1 rounded-full bg-white/40 p-1 shadow-[inset_0_1px_3px_rgba(8,37,50,0.04)]">
                {publicNavItems.map((item) => {
                  const active = currentPath === normalizePath(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'inline-flex h-8 shrink-0 items-center justify-center whitespace-nowrap rounded-full px-3 text-[11px] font-bold leading-none text-muted-foreground transition hover:bg-primary-50 hover:text-primary-900 xl:px-4 xl:text-xs',
                        active && activeMenuClass
                      )}
                    >
                      <span className="relative -top-px block leading-none">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="hidden shrink-0 items-center gap-2 md:flex">
              <a href={`tel:${companyInfo.landlineHref}`} className="hidden items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-[11px] font-bold leading-none text-muted-foreground transition hover:bg-primary-50 hover:text-primary lg:inline-flex">
                <Phone className="size-3.5" aria-hidden="true" />
                {companyInfo.landlineDisplay}
              </a>
              <Button asChild variant="outline" size="sm" className="h-8 rounded-full border-white bg-white/72 px-3 text-[11px] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_5px_14px_rgba(8,37,50,0.08)] hover:bg-primary-50">
                <Link href="/admin"><LockKeyhole data-icon aria-hidden="true" />Admin Portal</Link>
              </Button>
              <Button asChild size="sm" className="h-8 rounded-full bg-primary-900 px-3 text-[11px] shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_8px_18px_rgba(8,37,50,0.18)] hover:bg-primary-800">
                <Link href="/rentals"><CalendarCheck data-icon aria-hidden="true" />Book Now</Link>
              </Button>
            </div>

            <Button variant="outline" size="icon" className="size-9 shrink-0 rounded-full bg-white/82 lg:hidden" onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation">
              {open ? <X data-icon aria-hidden="true" /> : <Menu data-icon aria-hidden="true" />}
            </Button>
          </div>
        </nav>

        {open ? (
          <div className="mx-auto w-full max-w-7xl px-4 pt-3 sm:px-6 lg:px-8 lg:hidden">
            <div className="premium-surface flex flex-col gap-1 rounded-[1.5rem] p-3 shadow-[0_18px_45px_rgba(8,37,50,0.16)]">
              {publicNavItems.map((item) => {
                const active = currentPath === normalizePath(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={cn('inline-flex h-10 items-center justify-center whitespace-nowrap rounded-2xl px-4 text-sm font-bold text-muted-foreground transition hover:bg-white hover:text-foreground', active && activeMenuClass)}
                  >
                    <span className="relative -top-px block leading-none">{item.label}</span>
                  </Link>
                );
              })}
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Button asChild variant="outline" className="rounded-full">
                  <Link href="/admin" onClick={() => setOpen(false)}><LockKeyhole data-icon aria-hidden="true" />Admin Portal</Link>
                </Button>
                <Button asChild className="rounded-full">
                  <Link href="/rentals" onClick={() => setOpen(false)}><CalendarCheck data-icon aria-hidden="true" />Book Now</Link>
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </header>

      <main>{children}</main>
      <PublicFooter />
    </div>
  );
}

function PublicFooter() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="container-x grid gap-10 py-12 md:grid-cols-[1.2fr_0.7fr_0.8fr_1fr]">
        <div className="flex flex-col gap-5">
          <BrandMark />
          <p className="max-w-sm text-sm leading-7 text-muted-foreground">
            Private jet ski and jet car experiences from {companyInfo.locationName}, prepared with a premium fleet and attentive local support.
          </p>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="flex size-10 items-center justify-center rounded-md border border-border text-primary transition hover:bg-primary-50" aria-label="Instagram">
            <Instagram data-icon aria-hidden="true" />
          </a>
        </div>
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-foreground">Explore</h3>
          {publicNavItems.slice(1, 6).map((item) => (
            <Link key={item.href} href={item.href} className="text-sm text-muted-foreground transition hover:text-primary">{item.label}</Link>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-foreground">Packages</h3>
          <Link href="/rentals#jet-ski-packages" className="text-sm text-muted-foreground transition hover:text-primary">Jet Ski Packages</Link>
          <Link href="/rentals#jet-car-packages" className="text-sm text-muted-foreground transition hover:text-primary">Jet Car Packages</Link>
          <Link href="/rentals#combo-packages" className="text-sm text-muted-foreground transition hover:text-primary">Combo Packages</Link>
          <Link href="/rentals#vip-packages" className="text-sm text-muted-foreground transition hover:text-primary">VIP Packages</Link>
        </div>
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-foreground">Contact</h3>
          <a href={`tel:${companyInfo.landlineHref}`} className="flex items-center gap-3 text-sm text-muted-foreground transition hover:text-primary"><Phone data-icon aria-hidden="true" />{companyInfo.landlineDisplay}</a>
          <a href={`mailto:${companyInfo.bookingEmail}`} className="flex items-center gap-3 text-sm text-muted-foreground transition hover:text-primary"><Mail data-icon aria-hidden="true" />{companyInfo.bookingEmail}</a>
          <p className="flex items-center gap-3 text-sm text-muted-foreground"><MapPin data-icon aria-hidden="true" />{companyInfo.locationName}</p>
        </div>
      </div>
      <div className="waterline border-t border-border py-5">
        <div className="container-x flex flex-col justify-between gap-4 text-xs text-muted-foreground lg:flex-row lg:items-center">
          <span>(c) 2026 eDrive Water Sports. All rights reserved.</span>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {policyLinks.map((item, index) => (
              <span key={item.href} className="inline-flex items-center gap-3">
                {index > 0 ? <span className="text-border">|</span> : null}
                <Link href={item.href} className="font-semibold transition hover:text-primary">{item.label}</Link>
              </span>
            ))}
          </div>
          <Link href="/rentals" className="inline-flex items-center gap-2 font-semibold text-primary">Explore packages <ArrowRight data-icon aria-hidden="true" /></Link>
        </div>
      </div>
    </footer>
  );
}
