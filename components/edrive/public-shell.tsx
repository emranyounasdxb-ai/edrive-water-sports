'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, CalendarCheck, Instagram, Mail, MapPin, Menu, Phone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { publicNavItems } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { BrandMark } from './brand';

export function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-hidden bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-white/95 backdrop-blur-xl">
        <nav className="container-x flex h-[76px] items-center justify-between gap-4">
          <Link href="/" aria-label="eDrive Water Sports home" className="shrink-0">
            <BrandMark />
          </Link>

          <div className="hidden items-center gap-1 xl:flex">
            {publicNavItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn('rounded-md px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-primary-50 hover:text-foreground', active && 'bg-primary-50 text-primary-800')}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="hidden items-center gap-4 md:flex">
            <a href="tel:+971501234567" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition hover:text-primary">
              <Phone data-icon aria-hidden="true" />
              +971 50 123 4567
            </a>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin">Admin Portal</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/booking">
                <CalendarCheck data-icon aria-hidden="true" />
                Book Now
              </Link>
            </Button>
          </div>

          <Button variant="outline" size="icon" className="xl:hidden" onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation">
            {open ? <X data-icon aria-hidden="true" /> : <Menu data-icon aria-hidden="true" />}
          </Button>
        </nav>

        {open ? (
          <div className="border-t border-border bg-white px-4 py-4 shadow-premium xl:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-1">
              {publicNavItems.map((item) => (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="rounded-md px-3 py-3 text-sm font-semibold text-muted-foreground transition hover:bg-primary-50 hover:text-foreground">
                  {item.label}
                </Link>
              ))}
              <Link href="/admin" onClick={() => setOpen(false)} className="rounded-md px-3 py-3 text-sm font-semibold text-primary transition hover:bg-primary-50">
                Admin Portal
              </Link>
              <Button asChild className="mt-3">
                <Link href="/booking" onClick={() => setOpen(false)}>
                  <CalendarCheck data-icon aria-hidden="true" />
                  Book Your Experience
                </Link>
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
            Private jet ski and jet car experiences from Dubai Marina, prepared with a premium fleet and attentive local support.
          </p>
          <a href="https://instagram.com" className="flex size-10 items-center justify-center rounded-md border border-border text-primary transition hover:bg-primary-50" aria-label="Instagram">
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
          <h3 className="text-sm font-semibold text-foreground">Experiences</h3>
          <Link href="/jet-ski-rentals" className="text-sm text-muted-foreground transition hover:text-primary">Jet Ski Rentals</Link>
          <Link href="/jet-car-rentals" className="text-sm text-muted-foreground transition hover:text-primary">Jet Car Rentals</Link>
          <Link href="/sales" className="text-sm text-muted-foreground transition hover:text-primary">Watercraft Sales</Link>
          <Link href="/gallery" className="text-sm text-muted-foreground transition hover:text-primary">Gallery</Link>
        </div>
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-foreground">Contact</h3>
          <a href="tel:+971501234567" className="flex items-center gap-3 text-sm text-muted-foreground transition hover:text-primary"><Phone data-icon aria-hidden="true" />+971 50 123 4567</a>
          <a href="mailto:bookings@edrivewatersports.ae" className="flex items-center gap-3 text-sm text-muted-foreground transition hover:text-primary"><Mail data-icon aria-hidden="true" />bookings@edrivewatersports.ae</a>
          <p className="flex items-center gap-3 text-sm text-muted-foreground"><MapPin data-icon aria-hidden="true" />Dubai Marina Walk, UAE</p>
        </div>
      </div>
      <div className="waterline border-t border-border py-5">
        <div className="container-x flex flex-col justify-between gap-3 text-xs text-muted-foreground sm:flex-row">
          <span>(c) 2026 eDrive Water Sports. All rights reserved.</span>
          <Link href="/booking" className="inline-flex items-center gap-2 font-semibold text-primary">Plan your ride <ArrowRight data-icon aria-hidden="true" /></Link>
        </div>
      </div>
    </footer>
  );
}
