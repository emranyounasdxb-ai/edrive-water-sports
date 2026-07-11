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
const bookingStatusBaseUrl = 'https://edrivedubai.ae/booking-status';

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
    <section className="container-x py-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary"><FileSearch className="size-3.5" aria-hidden="true" />Booking Status</span>
            <h1 className="mt-4 max-w-3xl font-heading text-4xl font-semibold leading-[0.98] tracking-[-0.03em] text-foreground sm:text-5xl">Check Your Booking Status</h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">Enter your booking reference number to view your latest request details and confirmation status.</p>
          </div>

          <form onSubmit={(event) => { event.preventDefault(); void searchBooking(); }} className="premium-surface rounded-[1.65rem] p-5">
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

        <div className="mt-6 pb-10">
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
  const perforationDots = Array.from({ length: 28 }, (_, index) => index);
  const bookingLink = `${bookingStatusBaseUrl}?ref=${encodeURIComponent(request.bookingCode)}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=8&data=${encodeURIComponent(bookingLink)}`;

  return (
    <article className="relative mx-auto grid max-w-[58rem] overflow-hidden rounded-[1.7rem] border border-gold/45 bg-[#fffaf0] shadow-[0_18px_32px_rgba(8,37,50,0.13),inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-9px_18px_rgba(120,82,18,0.045)] lg:grid-cols-[minmax(0,1fr)_11.75rem]">
      <div className="relative min-w-0">
        <span className="pointer-events-none absolute -left-7 top-[10.7rem] z-20 size-14 rounded-full bg-[#f1f1f1]" aria-hidden="true" />
        <div className="relative overflow-hidden rounded-br-[1.3rem] bg-primary-950 px-5 py-4 text-white sm:px-6" style={{ backgroundImage: "linear-gradient(90deg, rgba(5,30,42,0.98), rgba(5,30,42,0.76)), url('/images/edrive/packages/jet-car/jet-car-package-19.webp')", backgroundSize: 'cover', backgroundPosition: 'center 46%' }}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_16%,rgba(217,181,109,0.18),transparent_16rem)]" aria-hidden="true" />
          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-full border border-gold/45 bg-gold/10 text-gold shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_5px_12px_rgba(0,0,0,0.16)]"><TicketCheck className="size-4" aria-hidden="true" /></span>
                <div>
                  <p className="font-heading text-2xl font-semibold leading-none text-gold">eDrive</p>
                  <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.32em] text-white">Water Sports</p>
                </div>
              </div>
              <p className="mt-4 text-[9px] font-bold uppercase tracking-[0.25em] text-gold">Booking Reference</p>
              <h2 className="mt-2 font-heading text-3xl font-semibold leading-none tracking-[-0.035em] sm:text-4xl lg:text-[2.6rem]">{request.bookingCode}</h2>
              <p className="mt-2.5 text-xs text-white/84">Booking status and request details</p>
            </div>
            <span className={cn('relative z-10 w-fit rounded-full border px-3.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] shadow-[inset_0_1px_0_rgba(255,255,255,0.24),0_5px_14px_rgba(0,0,0,0.14)]', statusTone(status))}><span className="mr-1.5 inline-block size-1.5 rounded-full bg-current align-middle" />{status}</span>
          </div>
        </div>

        <div className="px-5 py-3.5 sm:px-6">
          <div className="grid gap-2.5 border-b border-primary-900/10 pb-3.5 sm:grid-cols-2 lg:grid-cols-3">
            <TicketInfo icon={Waves} label="Service" value={experience.title} />
            <TicketInfo icon={CalendarDays} label="Date" value={displayDate(request.preferredDate)} />
            <TicketInfo icon={Clock3} label="Time" value={request.preferredTime || 'Not selected'} />
            <TicketInfo icon={Hourglass} label="Duration" value={durationLabel(request)} />
            <TicketInfo icon={UserRound} label="Customer" value={request.customerName} />
            <TicketInfo icon={CreditCard} label="Payment" value={request.paymentStatus} danger={request.paymentStatus !== 'Paid'} />
          </div>

          <div className="border-b border-primary-900/10 py-2.5">
            <TicketInfo icon={TicketCheck} label="Package" value={request.selectedPackageName || request.selectedPackageCategory || 'Custom booking'} />
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_0.48fr]">
            <div className="relative overflow-hidden rounded-[1.15rem] border border-primary/15 bg-primary-50 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.88),inset_0_-8px_18px_rgba(14,124,134,0.045),0_8px_16px_rgba(8,37,50,0.075)]" style={{ backgroundImage: "linear-gradient(90deg, rgba(221,244,246,0.88), rgba(221,244,246,0.56)), url('/images/edrive/packages/jet-car/jet-car-package-15.webp')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
              <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-primary">Meeting Point</p>
              <p className="mt-1 font-heading text-lg font-semibold text-foreground">{companyInfo.locationName}</p>
              <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">{companyInfo.locationAddress}</p>
              <a href={companyInfo.mapLink} target="_blank" rel="noopener noreferrer" className="mt-2.5 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-white px-3 py-1.5 text-[10px] font-bold text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-3px_7px_rgba(8,37,50,0.035),0_4px_10px_rgba(8,37,50,0.07)] transition hover:-translate-y-0.5 hover:bg-primary-50"><MapPin className="size-3" aria-hidden="true" />Open in Google Maps</a>
            </div>
            <div className="rounded-[1.15rem] border border-gold/40 bg-primary-900 p-3.5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.14),inset_0_-8px_18px_rgba(0,0,0,0.15),0_9px_18px_rgba(8,37,50,0.13)]">
              <p className="text-[8px] font-bold uppercase tracking-[0.22em] text-gold">Estimated Total</p>
              <p className="mt-2.5 font-heading text-3xl font-semibold text-gold drop-shadow-sm">{totalLabel}</p>
              <div className="mt-3 h-px w-9 bg-gold" />
              <p className="mt-3 text-[10px] leading-5 text-white/78">Final availability and payment details are shared by the booking team.</p>
            </div>
          </div>
        </div>
      </div>

      <aside className="relative border-t border-primary-900/10 bg-[#fff8ed] px-4 py-5 lg:border-l-0 lg:border-t-0">
        <span className="pointer-events-none absolute -left-7 top-[10.7rem] hidden size-14 rounded-full bg-[#f1f1f1] lg:block" aria-hidden="true" />
        <div className="absolute inset-0 opacity-55" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(217,181,109,0.20) 1px, transparent 0)', backgroundSize: '16px 16px' }} aria-hidden="true" />
        <div className="absolute -left-[4px] top-4 bottom-4 hidden flex-col justify-between lg:flex" aria-hidden="true">
          {perforationDots.map((item) => <span key={item} className="size-1.5 rounded-full bg-[#f1f1f1] shadow-[0_0_0_1px_rgba(8,37,50,0.08)]" />)}
        </div>
        <div className="absolute left-0 top-4 bottom-4 hidden border-l border-dashed border-primary-900/25 lg:block" aria-hidden="true" />
        <div className="relative flex h-full flex-col items-center justify-between gap-4 text-center">
          <div>
            <span className="mx-auto flex size-14 items-center justify-center rounded-full border border-gold/30 bg-white text-gold shadow-[inset_0_1px_0_rgba(255,255,255,0.96),inset_0_-4px_9px_rgba(120,82,18,0.055),0_8px_16px_rgba(8,37,50,0.08)]"><TicketCheck className="size-6" aria-hidden="true" /></span>
            <div className="mx-auto mt-5 h-px w-20 bg-gold/45" />
          </div>

          <a href={bookingLink} target="_blank" rel="noopener noreferrer" className="group block">
            <p className="text-[8px] font-bold uppercase tracking-[0.22em] text-primary-900/80">Booking QR<br />Scan to open</p>
            <span className="mx-auto mt-2.5 block rounded-2xl border border-border bg-white p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.96),inset_0_-4px_9px_rgba(8,37,50,0.03),0_8px_18px_rgba(8,37,50,0.09)] transition group-hover:-translate-y-0.5">
              <img src={qrSrc} alt={`QR code for booking ${request.bookingCode}`} className="size-20 rounded-xl" />
            </span>
          </a>

          <div className="w-full">
            <div className="mx-auto h-px w-20 bg-gold/45" />
            <div className="mx-auto mt-4 h-10 w-32 rounded-md bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_5px_12px_rgba(8,37,50,0.07)]" style={{ backgroundImage: 'repeating-linear-gradient(90deg,#082532 0 2px,transparent 2px 5px,#082532 5px 6px,transparent 6px 10px)' }} aria-label={`Barcode for ${request.bookingCode}`} />
            <p className="mt-1 text-[8px] font-bold uppercase tracking-[0.18em] text-primary-900/55">{request.bookingCode}</p>
            <p className="mt-4 font-heading text-sm italic leading-5 text-gold">Thank you for choosing<br />eDrive Water Sports.</p>
          </div>
        </div>
      </aside>
    </article>
  );
}

function TicketInfo({ icon: Icon, label, value, danger = false }: { icon: ElementType; label: string; value: string; danger?: boolean }) {
  return <div className="flex min-h-[3.8rem] min-w-0 items-center gap-2.5 rounded-2xl bg-white/66 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.98),inset_0_-5px_10px_rgba(8,37,50,0.025),0_5px_12px_rgba(8,37,50,0.045)]"><span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_3px_7px_rgba(8,37,50,0.04)]"><Icon className="size-4" aria-hidden="true" /></span><div className="min-w-0"><p className="text-[8px] font-bold uppercase tracking-[0.17em] text-muted-foreground">{label}</p><p className={cn('mt-0.5 text-xs font-bold leading-5 text-foreground sm:text-sm', danger && 'text-red-600')}>{value}</p></div></div>;
}

function LoadingCard() {
  return <div className="premium-surface mx-auto max-w-2xl rounded-[1.75rem] p-6 text-center"><Loader2 className="mx-auto size-10 animate-spin text-primary" aria-hidden="true" /><h2 className="mt-4 font-heading text-2xl font-semibold text-foreground">Checking your booking</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Please wait while we check your latest booking details.</p></div>;
}

function NotFound({ reference, whatsappMessage }: { reference: string; whatsappMessage: string }) {
  return <div className="premium-surface mx-auto max-w-2xl rounded-[1.75rem] p-6 text-center"><FileSearch className="mx-auto size-10 text-primary" aria-hidden="true" /><h2 className="mt-4 font-heading text-2xl font-semibold text-foreground">Booking not found</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">We could not find {reference || 'this reference'}. Please check the reference number or contact the eDrive team on WhatsApp.</p><Button asChild className="mt-5 rounded-full"><a href={`${whatsappUrl}?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer"><MessageCircle data-icon aria-hidden="true" />Ask WhatsApp</a></Button></div>;
}

function EmptyPreview() {
  return <div className="premium-surface mx-auto max-w-3xl rounded-[1.75rem] p-6 text-center"><QrCode className="mx-auto size-10 text-primary" aria-hidden="true" /><h2 className="mt-4 font-heading text-2xl font-semibold text-foreground">Enter a booking reference</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">Your digital ticket will appear here after your booking reference is found.</p></div>;
}
