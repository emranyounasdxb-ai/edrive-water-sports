'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { CalendarCheck, Loader2, LockKeyhole, Menu, Search, TicketCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { bookingRequestsTable } from '@/lib/booking-records';
import { publicNavItems } from '@/lib/mock-data';
import { supabase } from '@/lib/supabase-client';
import { cn } from '@/lib/utils';
import { BrandMark } from './brand';

function normalizePath(pathname: string) {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/$/, '');
}

const trackButton = 'hidden items-center gap-2 rounded-full border border-amber-300/70 bg-gradient-to-b from-amber-50 via-amber-100 to-amber-300 px-3 py-2 text-[11px] font-bold text-primary-900 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:from-amber-50 hover:via-amber-200 hover:to-amber-400 hover:shadow-md lg:inline-flex';

export function PublicShellClean({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const currentPath = normalizePath(pathname);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 32);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  function openStatus() {
    setOpen(false);
    setStatusOpen(true);
    setError('');
  }

  async function searchBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = reference.trim().toUpperCase();
    if (!code) {
      setError('Please enter your booking reference number.');
      return;
    }

    setLoading(true);
    setError('');
    const { data, error: queryError } = await supabase.from(bookingRequestsTable).select('booking_code').eq('booking_code', code).maybeSingle();
    setLoading(false);

    if (queryError || !data) {
      setError('Booking number not found. Please check and enter it again.');
      return;
    }

    setStatusOpen(false);
    router.push(`/booking-status?ref=${encodeURIComponent(code)}`);
  }

  return (
    <div className="min-h-screen overflow-hidden bg-background">
      <header className="fixed inset-x-0 top-0 z-[90] py-3">
        <nav className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className={cn('flex min-h-[50px] items-center justify-between gap-3 rounded-full border px-4 ring-1 transition-all duration-300', scrolled ? 'border-white/90 bg-white/90 shadow-xl ring-black/5 backdrop-blur-sm' : 'border-white bg-white shadow-2xl ring-black/5')}>
            <Link href="/" aria-label="eDrive Water Sports home" className="flex shrink-0 items-center">
              <BrandMark className="[&_img]:h-9 [&_img]:w-auto" />
            </Link>

            <div className="hidden min-w-0 flex-1 items-center justify-center lg:flex">
              <div className="flex items-center gap-1.5 rounded-full bg-white p-1 shadow-inner">
                {publicNavItems.map((item) => {
                  const active = currentPath === normalizePath(item.href);
                  return <Link key={item.href} href={item.href} className={cn('inline-flex h-8 items-center rounded-full px-3 text-[11px] font-bold text-slate-700 transition hover:bg-primary-50 xl:px-4', active && 'bg-primary-100 text-primary-900')}>{item.label}</Link>;
                })}
              </div>
            </div>

            <div className="hidden shrink-0 items-center gap-2 md:flex">
              <button type="button" onClick={openStatus} className={trackButton} aria-label="Track booking status by reference number"><TicketCheck className="size-3.5" aria-hidden="true" />Track Booking</button>
              <Button asChild variant="outline" size="sm" className="h-8 rounded-full bg-white px-3 text-[11px] transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-50"><Link href="/admin"><LockKeyhole data-icon aria-hidden="true" />Staff Login</Link></Button>
              <Button asChild size="sm" className="h-8 rounded-full bg-primary-900 px-3 text-[11px] transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-800"><Link href="/booking"><CalendarCheck data-icon aria-hidden="true" />Book Now</Link></Button>
            </div>

            <Button variant="outline" size="icon" className="size-9 shrink-0 rounded-full bg-white lg:hidden" onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation">{open ? <X data-icon aria-hidden="true" /> : <Menu data-icon aria-hidden="true" />}</Button>
          </div>
        </nav>

        {open ? <div className="mx-auto w-full max-w-7xl px-4 pt-3 sm:px-6 lg:px-8 lg:hidden"><div className="premium-surface flex flex-col gap-1 rounded-[1.5rem] p-3 shadow-xl">{publicNavItems.map((item) => <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="inline-flex h-10 items-center justify-center rounded-2xl px-4 text-sm font-bold text-muted-foreground hover:bg-white hover:text-foreground">{item.label}</Link>)}<div className="mt-3 grid gap-2 sm:grid-cols-3"><Button type="button" variant="outline" className="rounded-full border-amber-300/70 bg-gradient-to-b from-amber-50 via-amber-100 to-amber-300 text-primary-900 hover:-translate-y-0.5" onClick={openStatus}><TicketCheck data-icon aria-hidden="true" />Track Booking</Button><Button asChild variant="outline" className="rounded-full hover:-translate-y-0.5"><Link href="/admin" onClick={() => setOpen(false)}><LockKeyhole data-icon aria-hidden="true" />Staff Login</Link></Button><Button asChild className="rounded-full hover:-translate-y-0.5"><Link href="/booking" onClick={() => setOpen(false)}><CalendarCheck data-icon aria-hidden="true" />Book Now</Link></Button></div></div></div> : null}
      </header>

      {statusOpen ? <div className="fixed inset-0 z-[120] flex items-center justify-center bg-primary-950/45 px-4 backdrop-blur-sm"><div className="w-full max-w-md overflow-hidden rounded-[1.75rem] border border-white/80 bg-white shadow-2xl"><div className="flex items-start justify-between gap-4 border-b border-border bg-primary-50 px-5 py-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Booking Status</p><h2 className="mt-1 font-heading text-2xl font-semibold text-foreground">Track your booking</h2></div><button type="button" onClick={() => setStatusOpen(false)} className="flex size-9 items-center justify-center rounded-full border bg-white text-muted-foreground hover:text-primary" aria-label="Close"><X className="size-4" aria-hidden="true" /></button></div><form onSubmit={searchBooking} className="p-5"><label className="grid gap-2 text-sm font-semibold text-foreground">Booking reference number<span className="relative"><Search className="pointer-events-none absolute left-4 top-3.5 size-4 text-muted-foreground" aria-hidden="true" /><input value={reference} onChange={(event) => setReference(event.target.value.toUpperCase())} placeholder="ED-20260707-007" className="h-12 w-full rounded-2xl border border-border bg-white pl-11 pr-4 text-sm font-bold uppercase text-foreground outline-none focus:border-primary" /></span></label>{error ? <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold leading-5 text-red-700">{error}</p> : <p className="mt-3 text-xs leading-5 text-muted-foreground">Enter the reference number shown on your booking confirmation page.</p>}<Button type="submit" disabled={loading} className="mt-5 w-full rounded-full">{loading ? <Loader2 data-icon className="animate-spin" aria-hidden="true" /> : <Search data-icon aria-hidden="true" />}{loading ? 'Checking...' : 'Search Booking'}</Button></form></div></div> : null}

      <main className="pt-[84px]">{children}</main>
    </div>
  );
}
