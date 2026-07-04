'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, Instagram, Mail, MapPin, Menu, MessageCircle, Phone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { companyInfo, whatsappUrl } from '@/lib/company-info';
import { publicNavItems } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { BrandMark } from './brand';

const activeMenuClass = 'bg-primary-100 text-primary-900 shadow-[0_7px_18px_rgba(8,37,50,0.08)]';

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
  const isHome = currentPath === '/';
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-hidden bg-background">
      <header className={cn(isHome ? 'absolute inset-x-0 top-0 z-[70] py-4' : 'sticky top-0 z-[70] bg-background/82 py-3 backdrop-blur-xl')}>
        <nav className="mx-auto w-full max-w-[88rem] px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-[62px] items-center justify-between gap-4 rounded-full border border-white/45 bg-white/82 px-5 shadow-[0_14px_42px_rgba(8,37,50,0.12)] backdrop-blur-xl">
            <Link href="/" aria-label="eDrive Water Sports home" className="flex shrink-0 items-center">
              <BrandMark className="[&_img]:h-11 [&_img]:w-auto" />
            </Link>

            <div className="hidden min-w-0 flex-1 items-center justify-center xl:flex">
              <div className="flex items-center gap-1 rounded-full bg-white/58 p-1">
                {publicNavItems.map((item) => {
                  const active = currentPath === normalizePath(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-full px-4 text-sm font-bold leading-none text-primary-900/62 transition hover:bg-primary-50 hover:text-primary-900',
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
              <a href={`tel:${companyInfo.landlineHref}`} className="hidden items-center gap-2 whitespace-nowrap rounded-full bg-white px-4 py-2.5 text-xs font-bold leading-none text-primary-900 shadow-sm transition hover:bg-primary-50 hover:text-primary 2xl:inline-flex">
                <Phone data-icon aria-hidden="true" />
                {companyInfo.landlineDisplay}
              </a>
              <Button asChild size="sm" className="whitespace-nowrap rounded-full bg-primary-900 shadow-sm hover:bg-primary-800">
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle data-icon aria-hidden="true" />
                  WhatsApp
                </a>
              </Button>
            </div>

            <Button variant="outline" size="icon" className="shrink-0 rounded-full xl:hidden" onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation">
              {open ? <X data-icon aria-hidden="true" /> : <Menu data-icon aria-hidden="true" />}
            </Button>
          </div>
        </nav>

        {open ? (
          <div className="mx-auto w-full max-w-[88rem] px-4 pt-3 sm:px-6 lg:px-8 xl:hidden">
            <div className="premium-surface flex flex-col gap-1 rounded-[2rem] p-3">
              {publicNavItems.map((item) => {
                const active = currentPath === normalizePath(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={cn('inline-flex h-11 items-center justify-center whitespace-nowrap rounded-2xl px-4 text-sm font-bold text-muted-foreground transition hover:bg-white hover:text-foreground', active && activeMenuClass)}
                  >
                    <span className="relative -top-px block leading-none">{item.label}</span>
                  </Link>
                );
              })}
              <Button asChild className="mt-3 rounded-full">
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}>
                  <MessageCircle data-icon aria-hidden="true" />
                  WhatsApp
                </a>
              </Button>
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
