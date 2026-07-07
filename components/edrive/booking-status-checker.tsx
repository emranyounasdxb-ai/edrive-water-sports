'use client';

import { useEffect, useMemo, useState, type ElementType } from 'react';
import { CalendarDays, Clock3, CreditCard, FileSearch, Hourglass, Loader2, MapPin, MessageCircle, QrCode, Search, TicketCheck, UserRound, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookingRequest, BookingStatus, formatAed, getExperience, normalizeBookingStatus } from '@/lib/booking-data';
import { bookingRequestsTable, bookingRowToRequest } from '@/lib/booking-records';
import { companyInfo, whatsappUrl } from '@/lib/company-info';
import { supabase } from '@/lib/supabase-client';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'edrive-booking-requests';

function cleanRef(value: string) {
  return value.trim().toUpperCase();
}

function displayDate(value: string) {
  if (!value) return 'Not selected';
  return new Intl.DateTimeFormat('en-AE', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${value}T12:00:00`));
}

function durationLabel(request: BookingRequest) {
  if (request.serviceType === 'sales_inquiry') return request.inquiryType || 'Sales inquiry';
  return request.durationMinutes < 60 ? `${request.durationMinutes} min` : request.durationMinutes === 60 ? '60 min' : `${request.durationMinutes / 60} hrs`;
}

function statusTone(status: BookingStatus) {
  if (status === 'Confirmed') return 'border-emerald-300/60 bg-emerald-50 text-emerald-700';
  if (status === 'Completed') return 'border-primary/25 bg-primary-50 text-primary-900';
  if (status === 'Cancelled') return 'border-red-300/60 bg-red-50 text-red-700';
  if (status === 'No Show') return 'border-orange-300/60 bg-orange-50 text-orange-700';
  return 'border-gold/70 bg-gold/10 text-gold';
}

function readLocalBookings() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? (parsed as BookingRequest[]) : [];
  } catch {
    return [];
  }
}

async function readRemoteBooking(code: string) {
  const { data, error } = await supabase.from(bookingRequestsTable).select('*').eq('booking_code', code).maybeSingle();
  if (error || !data) return null;
  return bookingRowToRequest(data as Record<string, unknown>);
}

export function BookingStatusChecker() {
  const [reference, setReference] = useState('');
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BookingRequest | null>(null);

  async function searchBooking(value = reference) {
    const code = cleanRef(value);
    if (!code) return;
    setReference(code);
    setSearched(true);
    setLoading(true);

    const remoteBooking = await readRemoteBooking(code);
    const localBooking = readLocalBookings().find((item) => cleanRef(item.bookingCode) === code) || null;
    setResult(remoteBooking || localBooking);
    setLoading(false);
  }

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (ref) void searchBooking(ref);
  }, []);

  const whatsappMessage = useMemo(() => encodeURIComponent(`Hello eDrive, I want to check my booking status. Reference: ${reference || 'ED-'}`), [reference]);

  return (
    <section className="container-x py-10 sm:py-14">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-7 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary"><FileSearch className="size-3.5" aria-hidden="true" />Booking Status</span>
            <h1 className="mt-5 max-w-3xl font-heading text-4xl font-semibold leading-[0.98] tracking-[-0.03em] text-foreground sm:text-5xl lg:text-6xl">Check Your Booking Status</h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">Enter your booking reference number to view the live booking status from the booking system.</p>
          </div>

          <form onSubmit={(event) => { event.preventDefault(); void searchBooking(); }} className="premium-surface rounded-[1.75rem] p-5 sm:p-6">
            <label className="grid gap-2 text-sm font-semibold text-foreground">
              Booking reference number
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-3.5 size-4 text-muted-foreground" aria-hidden="true" />
                <Input value={reference} onChange={(event) => setReference(event.target.value.toUpperCase())} placeholder="ED-20260707-007" className="h-12 rounded-2xl pl-11 font-semibold uppercase" />
              </div>
            </label>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button type="submit" className="rounded-full bg-primary-900 shadow-[0_10px_24px_rgba(8,37,50,0.18)] hover:bg-primary-800" disabled={loading}>{loading ? <Loader2 data-icon className="animate-spin" aria-hidden="true" /> : <Search data-icon aria-hidden="true" />}{loading ? 'Searching...' : 'Search Booking'}</Button>
              <Button asChild className="rounded-full bg-emerald-500 shadow-[0_10px_22px_rgba(16,185,129,0.25)] hover:bg-emerald-600"><a href={`${whatsappUrl}?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer"><MessageCircle data-icon aria-hidden="true" />Ask WhatsApp</a></Button>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">Example: ED-20260707-007. Your reference is shown after submitting the booking form.</p>
          </form>
        </div>

        <div className="mt-8 sm:mt-10">
          {loading ? <LoadingCard /> : result ? <TicketResult request={result} /> : searched ? <NotFound reference={reference} whatsappMessage={whatsappMessage} /> : <EmptyPreview />}
        </div>
      </div>
    </section>
  );
}

function TicketResult({ request }: { request: BookingRequest }) {
  const experience = getExperience(request.experienceType);
  const isSales = request.serviceType === 'sales_inquiry';
  const totalLabel = isSales ? 'Request quote' : formatAed(request.totalAmount);
  const status = normalizeBookingStatus(request.status);
  const qrBlocks = Array.from({ length: 49 }, (_, index) => index);
  const barcodeBars = Array.from({ length: 32 }, (_, index) => index);

  return (
    <article className="relative mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] border border-gold/45 bg-[#fffaf0] shadow-[0_28px_80px_rgba(8,37,50,0.16)] lg:grid-cols-[minmax(0,1fr)_15.5rem]">
      <div className="relative min-w-0">
        <span className="absolute -left-8 top-[15.2rem] z-10 size-16 rounded-full border border-gold/30 bg-background" aria-hidden="true" />
        <div className="relative overflow-hidden rounded-br-[1.65rem] bg-primary-950 px-6 py-7 text-white sm:px-8 lg:px-10" style={{ backgroundImage: "linear-gradient(90deg, rgba(5,30,42,0.96), rgba(5,30,42,0.78)), url('/images/edrive/packages/jet-car/jet-car-package-19.webp')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_20%,rgba(217,181,109,0.22),transparent_22rem)]" aria-hidden="true" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-full border border-gold/45 bg-gold/10 text-gold"><TicketCheck className="size-5" aria-hidden="true" /></span>
                <div>
                  <p className="font-heading text-3xl font-semibold leading-none text-gold">eDrive</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.38em] text-white">Water Sports</p>
                </div>
              </div>
              <p className="mt-7 text-xs font-bold uppercase tracking-[0.28em] text-gold">Booking Reference</p>
              <h2 className="mt-3 font-heading text-4xl font-semibold leading-none tracking-[-0.03em] sm:text-5xl lg:text-6xl">{request.bookingCode}</h2>
              <p className="mt-4 text-sm text-white/82">Live booking status and request details</p>
            </div>
            <span className={cn('relative z-10 w-fit rounded-full border px-5 py-2 text-xs font-bold uppercase tracking-[0.22em]', statusTone(status))}><span className="mr-2 inline-block size-1.5 rounded-full bg-current align-middle" />{status}</span>
          </div>
        </div>

        <div className="px-6 py-6 sm:px-8 lg:px-10">
          <div className="grid gap-x-8 gap-y-5 border-b border-primary-900/10 pb-5 sm:grid-cols-2 lg:grid-cols-3">
            <TicketInfo icon={Waves} label="Service" value={experience.title} />
            <TicketInfo icon={CalendarDays} label="Date" value={displayDate(request.preferredDate)} />
            <TicketInfo icon={Clock3} label="Time" value={request.preferredTime || 'Not selected'} />
            <TicketInfo icon={Hourglass} label="Duration" value={durationLabel(request)} />
            <TicketInfo icon={UserRound} label="Customer" value={request.customerName} />
            <TicketInfo icon={CreditCard} label="Payment" value={request.paymentStatus} danger={request.paymentStatus !== 'Paid'} />
          </div>

          <div className="border-b border-primary-900/10 py-5">
            <TicketInfo icon={TicketCheck} label="Package" value={request.selectedPackageName || request.selectedPackageCategory || 'Custom booking'} />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.55fr]">
            <div className="relative overflow-hidden rounded-[1.35rem] border border-primary/15 bg-primary-50 p-5" style={{ backgroundImage: "linear-gradient(90deg, rgba(221,244,246,0.96), rgba(221,244,246,0.78)), url('/images/edrive/packages/jet-car/jet-car-package-15.webp')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Meeting Point</p>
              <p className="mt-2 font-heading text-2xl font-semibold text-foreground">{companyInfo.locationName}</p>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{companyInfo.locationAddress}</p>
              <a href={companyInfo.mapLink} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-white px-4 py-2 text-xs font-bold text-primary shadow-sm transition hover:-translate-y-0.5 hover:bg-primary-50"><MapPin className="size-3.5" aria-hidden="true" />Open in Google Maps</a>
            </div>
            <div className="rounded-[1.35rem] border border-gold/35 bg-primary-900 p-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.10)]">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gold">Estimated Total</p>
              <p className="mt-4 font-heading text-4xl font-semibold text-gold">{totalLabel}</p>
              <div className="mt-5 h-px w-10 bg-gold" />
              <p className="mt-5 text-xs leading-6 text-white/75">Final availability and payment details are shared by the booking team.</p>
            </div>
          </div>
        </div>
      </div>

      <aside className="relative border-t border-dashed border-primary-900/18 bg-[#fff8ed] px-7 py-8 lg:border-l lg:border-t-0">
        <span className="absolute -left-8 top-[15.2rem] hidden size-16 rounded-full border border-gold/30 bg-background lg:block" aria-hidden="true" />
        <div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(217,181,109,0.22) 1px, transparent 0)', backgroundSize: '22px 22px' }} aria-hidden="true" />
        <div className="relative flex h-full flex-col items-center justify-between gap-8 text-center">
          <div>
            <span className="mx-auto flex size-20 items-center justify-center rounded-full border border-gold/30 bg-white text-gold shadow-sm"><TicketCheck className="size-9" aria-hidden="true" /></span>
            <div className="mx-auto mt-10 h-px w-28 bg-gold/45" />
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary-900/80">Scan to view<br />booking details</p>
            <div className="mx-auto mt-4 grid size-28 grid-cols-7 gap-1 rounded-2xl border border-border bg-white p-3 shadow-sm">
              {qrBlocks.map((item) => <span key={item} className={cn('rounded-[2px]', item % 2 === 0 || item % 5 === 0 || item === 8 || item === 40 ? 'bg-primary-900' : 'bg-transparent')} />)}
            </div>
          </div>

          <div className="w-full">
            <div className="mx-auto h-px w-28 bg-gold/45" />
            <div className="mx-auto mt-8 flex h-14 w-40 items-end justify-center gap-1 bg-white px-2 py-2">
              {barcodeBars.map((item) => <span key={item} className="block bg-primary-950" style={{ width: item % 5 === 0 ? 4 : item % 2 === 0 ? 2 : 1, height: item % 3 === 0 ? 42 : item % 4 === 0 ? 34 : 48 }} />)}
            </div>
            <p className="mt-8 font-heading text-lg italic leading-7 text-gold">Thank you for choosing<br />eDrive Water Sports.</p>
          </div>
        </div>
      </aside>
    </article>
  );
}

function TicketInfo({ icon: Icon, label, value, danger = false }: { icon: ElementType; label: string; value: string; danger?: boolean }) {
  return <div className="flex min-w-0 items-center gap-4"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary"><Icon className="size-5" aria-hidden="true" /></span><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</p><p className={cn('mt-1 text-sm font-bold leading-5 text-foreground sm:text-base', danger && 'text-red-600')}>{value}</p></div></div>;
}

function LoadingCard() {
  return <div className="premium-surface mx-auto max-w-2xl rounded-[1.75rem] p-6 text-center"><Loader2 className="mx-auto size-10 animate-spin text-primary" aria-hidden="true" /><h2 className="mt-4 font-heading text-2xl font-semibold text-foreground">Searching booking system</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Please wait while we check your latest booking status.</p></div>;
}

function NotFound({ reference, whatsappMessage }: { reference: string; whatsappMessage: string }) {
  return <div className="premium-surface mx-auto max-w-2xl rounded-[1.75rem] p-6 text-center"><FileSearch className="mx-auto size-10 text-primary" aria-hidden="true" /><h2 className="mt-4 font-heading text-2xl font-semibold text-foreground">Booking not found</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">We could not find {reference || 'this reference'} in the booking system. Please check the reference number or contact the eDrive team on WhatsApp.</p><Button asChild className="mt-5 rounded-full"><a href={`${whatsappUrl}?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer"><MessageCircle data-icon aria-hidden="true" />Ask WhatsApp</a></Button></div>;
}

function EmptyPreview() {
  return <div className="premium-surface mx-auto max-w-3xl rounded-[1.75rem] p-6 text-center"><QrCode className="mx-auto size-10 text-primary" aria-hidden="true" /><h2 className="mt-4 font-heading text-2xl font-semibold text-foreground">Enter a booking reference</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Your digital ticket will appear here after your booking reference is found in the eDrive booking system.</p></div>;
}
