'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { Instagram, Loader2, LockKeyhole, Mail, MapPin, Menu, Phone, Search, TicketCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { companyInfo } from '@/lib/company-info';
import { bookingRequestsTable } from '@/lib/booking-records';
import { publicNavItems } from '@/lib/mock-data';
import { supabase } from '@/lib/supabase-client';
import { cn } from '@/lib/utils';
import { BrandMark } from './brand';

const menuPillClass = 'border border-white/75 bg-white/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-8px_14px_rgba(8,37,50,0.025),0_5px_14px_rgba(8,37,50,0.045)] hover:border-primary/15 hover:bg-primary-50/80 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-8px_14px_rgba(8,37,50,0.025),0_8px_18px_rgba(8,37,50,0.07)]';
const activeMenuClass = 'border-primary/18 bg-primary-100 text-primary-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-8px_14px_rgba(8,37,50,0.03),0_9px_20px_rgba(8,37,50,0.09)]';
const actionBaseClass = 'inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 text-[11px] font-bold leading-none transition-all duration-200 hover:-translate-y-0.5';
const myBookingActionClass = `${actionBaseClass} border border-cyan-100 bg-[linear-gradient(145deg,#E9FCFF_0%,#C8F5F8_48%,#FFFFFF_100%)] text-primary-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.98),inset_0_-10px_18px_rgba(0,139,156,0.08),0_12px_26px_rgba(0,139,156,0.18),0_2px_5px_rgba(255,255,255,0.8)] hover:border-primary/25 hover:shadow-[inset_0_1px_0_rgba(255,255,255,1),inset_0_-10px_18px_rgba(0,139,156,0.11),0_16px_34px_rgba(0,139,156,0.24)]`;
const staffActionClass = `${actionBaseClass} border border-amber-100 bg-[linear-gradient(145deg,#FFF6D9_0%,#FFFFFF_48%,#EAF8FA_100%)] text-primary-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.98),inset_0_-10px_18px_rgba(159,118,44,0.08),0_12px_26px_rgba(8,37,50,0.13),0_2px_5px_rgba(255,255,255,0.82)] hover:border-accent-300/70 hover:shadow-[inset_0_1px_0_rgba(255,255,255,1),inset_0_-10px_18px_rgba(159,118,44,0.11),0_16px_34px_rgba(8,37,50,0.18)]`;

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
  const [scrolled, setScrolled] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusReference, setStatusReference] = useState('');
  const [statusError, setStatusError] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    const updateHeader = () => setScrolled(window.scrollY > 32);
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
    return () => window.removeEventListener('scroll', updateHeader);
  }, []);

  async function handleStatusSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = statusReference.trim().toUpperCase();
    if (!code) {
      setStatusError('Please enter your booking reference number.');
      return;
    }

    setStatusLoading(true);
    setStatusError('');
    const { data, error } = await supabase.from(bookingRequestsTable).select('booking_code').eq('booking_code', code).maybeSingle();
    setStatusLoading(false);

    if (error || !data) {
      setStatusError('Booking number not found. Please check and enter it again.');
      return;
    }

    window.location.href = `/booking-status?ref=${encodeURIComponent(code)}`;
  }

  function openStatusModal() {
    setOpen(false);
    setStatusModalOpen(true);
    setStatusError('');
  }

  return (
    <div className="min-h-screen overflow-hidden bg-background">
      <header className="fixed inset-x-0 top-0 z-[90] py-3">
        <nav className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            className={cn(
              'relative flex min-h-[50px] items-center justify-between gap-3 rounded-full px-4 ring-1 transition-all duration-300 ease-out',
              'shadow-[inset_0_1px_0_rgba(255,255,255,1),inset_0_-10px_22px_rgba(8,37,50,0.025),0_18px_42px_rgba(8,37,50,0.18),0_3px_8px_rgba(255,255,255,0.65)]',
              scrolled
                ? 'border border-white/90 bg-white/90 ring-black/5 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-10px_22px_rgba(8,37,50,0.025),0_14px_32px_rgba(8,37,50,0.12)]'
                : 'border border-white bg-white ring-black/5'
            )}
          >
            <Link href="/" aria-label="eDrive Water Sports home" className="z-10 flex shrink-0 items-center">
              <BrandMark className="[&_img]:h-9 [&_img]:w-auto" />
            </Link>

            <div className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 lg:flex">
              <div className={cn('pointer-events-auto flex items-center justify-center gap-1.5 rounded-full p-1 transition-all duration-300', scrolled ? 'bg-white/82 shadow-[inset_0_1px_5px_rgba(8,37,50,0.04)] backdrop-blur-sm' : 'bg-white shadow-[inset_0_1px_4px_rgba(8,37,50,0.05)]')}>
                {publicNavItems.map((item) => {
                  const active = currentPath === normalizePath(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'inline-flex h-8 shrink-0 items-center justify-center whitespace-nowrap rounded-full px-3 text-center text-[11px] font-bold leading-none text-slate-700 transition-all duration-200 xl:px-4 xl:text-xs',
                        menuPillClass,
                        active && activeMenuClass
                      )}
                    >
                      <span className="relative -top-px block leading-none">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="z-10 ml-auto hidden shrink-0 items-center gap-2 md:flex">
              <button type="button" onClick={openStatusModal} className={cn('hidden lg:inline-flex', myBookingActionClass)}>
                <TicketCheck className="size-3.5" aria-hidden="true" />
                <span>My Booking</span>
              </button>
              <Link href="/admin" className={staffActionClass}>
                <LockKeyhole className="size-3.5" aria-hidden="true" />
                <span>Staff Login</span>
              </Link>
            </div>

            <Button variant="outline" size="icon" className={cn('z-10 size-9 shrink-0 rounded-full lg:hidden', scrolled ? 'bg-white/90 backdrop-blur-sm' : 'bg-white')} onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation">
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
                <button type="button" className={myBookingActionClass} onClick={openStatusModal}>
                  <TicketCheck className="size-3.5" aria-hidden="true" />
                  <span>My Booking</span>
                </button>
                <Link href="/admin" onClick={() => setOpen(false)} className={staffActionClass}>
                  <LockKeyhole className="size-3.5" aria-hidden="true" />
                  <span>Staff Login</span>
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </header>

      {statusModalOpen ? (
        <BookingStatusModal
          reference={statusReference}
          error={statusError}
          loading={statusLoading}
          onReferenceChange={setStatusReference}
          onClose={() => setStatusModalOpen(false)}
          onSubmit={handleStatusSearch}
        />
      ) : null}

      <main className="pt-[86px]">{children}</main>
      <PublicFooter />
    </div>
  );
}

function BookingStatusModal({ reference, error, loading, onReferenceChange, onClose, onSubmit }: { reference: string; error: string; loading: boolean; onReferenceChange: (value: string) => void; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-primary-950/45 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-[1.75rem] border border-white/80 bg-white shadow-[0_28px_85px_rgba(8,37,50,0.28)]">
        <div className="flex items-start justify-between gap-4 border-b border-border bg-primary-50 px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Booking Status</p>
            <h2 className="mt-1 font-heading text-2xl font-semibold text-foreground">Check your booking</h2>
          </div>
          <button type="button" onClick={onClose} className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-white text-muted-foreground transition hover:text-primary" aria-label="Close status checker">
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-5">
          <label className="grid gap-2 text-sm font-semibold text-foreground">
            Booking reference number
            <span className="relative">
              <Search className="pointer-events-none absolute left-4 top-3.5 size-4 text-muted-foreground" aria-hidden="true" />
              <input value={reference} onChange={(event) => onReferenceChange(event.target.value.toUpperCase())} placeholder="ED-20260707-007" className="h-12 w-full rounded-2xl border border-border bg-white pl-11 pr-4 text-sm font-bold uppercase text-foreground outline-none transition focus:border-primary" />
            </span>
          </label>
          {error ? <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold leading-5 text-red-700">{error}</p> : <p className="mt-3 text-xs leading-5 text-muted-foreground">Enter the reference number shown on your booking confirmation page.</p>}
          <Button type="submit" disabled={loading} className="mt-5 w-full rounded-full">
            {loading ? <Loader2 data-icon className="animate-spin" aria-hidden="true" /> : <Search data-icon aria-hidden="true" />}
            {loading ? 'Checking...' : 'Search Booking'}
          </Button>
        </form>
      </div>
    </div>
  );
}

function PublicFooter() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="container-x grid gap-10 py-12 md:grid-cols-[1.2fr_0.7fr_1fr]">
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
          {publicNavItems.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm text-muted-foreground transition hover:text-primary">{item.label}</Link>
          ))}
          <Link href="/booking" className="text-sm text-muted-foreground transition hover:text-primary">Book Ride</Link>
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
          <Link href="/booking" className="inline-flex items-center gap-2 font-semibold text-primary">Book your ride</Link>
        </div>
      </div>
    </footer>
  );
}
