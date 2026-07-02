'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, CalendarCheck, Menu, Phone, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { publicNavItems } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { BrandMark } from './brand';

export function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-hidden">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-ocean-abyss/[0.78] backdrop-blur-2xl">
        <nav className="container-x flex h-20 items-center justify-between gap-4">
          <Link href="/" aria-label="eDrive Water Sports home" className="shrink-0">
            <BrandMark />
          </Link>

          <div className="hidden items-center gap-1 lg:flex">
            {publicNavItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-md px-3 py-2 text-xs font-semibold text-pearl-muted transition hover:bg-white/[0.08] hover:text-pearl',
                    active && 'bg-primary/[0.12] text-ocean-glow'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <a href="tel:+971501234567" className="inline-flex items-center gap-2 text-xs font-semibold text-pearl-muted transition hover:text-pearl">
              <Phone data-icon aria-hidden="true" />
              +971 50 123 4567
            </a>
            <Button asChild variant="gold" size="sm">
              <Link href="/booking">
                <CalendarCheck data-icon aria-hidden="true" />
                Book Now
                <ArrowRight data-icon aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <Button variant="outline" size="icon" className="lg:hidden" onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation">
            {open ? <X data-icon aria-hidden="true" /> : <Menu data-icon aria-hidden="true" />}
          </Button>
        </nav>

        {open ? (
          <div className="border-t border-white/10 bg-ocean-deep/[0.96] px-4 py-4 backdrop-blur-2xl lg:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-2">
              {publicNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-3 text-sm font-semibold text-pearl-muted transition hover:bg-white/[0.08] hover:text-pearl"
                >
                  {item.label}
                </Link>
              ))}
              <Button asChild variant="gold" className="mt-2">
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
    <footer className="border-t border-white/10 bg-ocean-abyss/95">
      <div className="container-x grid gap-10 py-12 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div className="flex flex-col gap-5">
          <BrandMark />
          <p className="max-w-md text-sm leading-7 text-pearl-muted">
            Premium jet ski rentals, jet car experiences, and curated water-sports sales from Dubai Marina.
          </p>
          <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-gold">
            <span>Dubai Marina</span>
            <span>JBR</span>
            <span>Bluewaters</span>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-pearl">Explore</h3>
          {publicNavItems.slice(1, 6).map((item) => (
            <Link key={item.href} href={item.href} className="text-sm text-pearl-muted transition hover:text-ocean-glow">
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-pearl">Contact</h3>
          <a href="tel:+971501234567" className="text-sm text-pearl-muted transition hover:text-ocean-glow">+971 50 123 4567</a>
          <a href="mailto:bookings@edrivewatersports.ae" className="text-sm text-pearl-muted transition hover:text-ocean-glow">bookings@edrivewatersports.ae</a>
          <p className="text-sm text-pearl-muted">Dubai Marina Walk, UAE</p>
        </div>
      </div>
      <div className="waterline border-t border-white/10 py-5">
        <div className="container-x flex flex-col justify-between gap-3 text-xs text-muted-foreground sm:flex-row">
          <span>© 2026 eDrive Water Sports. All rights reserved.</span>
          <span>Frontend-only static mockup. No backend integration.</span>
        </div>
      </div>
    </footer>
  );
}
