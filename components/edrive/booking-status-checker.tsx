'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, Clock3, CreditCard, FileSearch, MapPin, MessageCircle, Search, TicketCheck, UserRound, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookingRequest, formatAed, getExperience } from '@/lib/booking-data';
import { companyInfo, whatsappUrl } from '@/lib/company-info';
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

function statusTone(status: string) {
  if (status === 'Confirmed') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'Completed') return 'border-primary/20 bg-primary-50 text-primary-900';
  if (status === 'Cancelled') return 'border-red-200 bg-red-50 text-red-700';
  return 'border-gold/45 bg-gold/10 text-primary-900';
}

function readBookings() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed as BookingRequest[] : [];
  } catch {
    return [];
  }
}

export function BookingStatusChecker() {
  const [reference, setReference] = useState('');
  const [searched, setSearched] = useState(false);
  const [result, setResult] = useState<BookingRequest | null>(null);

  function searchBooking(value = reference) {
    const code = cleanRef(value);
    setReference(code);
    setSearched(true);
    const booking = readBookings().find((item) => cleanRef(item.bookingCode) === code) || null;
    setResult(booking);
  }

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (ref) searchBooking(ref);
  }, []);

  const whatsappMessage = useMemo(() => encodeURIComponent(`Hello eDrive, I want to check my booking status. Reference: ${reference || 'ED-'}`), [reference]);

  return (
    <section className="container-x py-9 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-primary"><FileSearch className="size-3.5" aria-hidden="true" />Booking Status</span>
            <h1 className="mt-4 font-heading text-4xl font-semibold leading-tight text-foreground sm:text-5xl">Check Your Booking Status</h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-muted-foreground">Enter your booking reference number to view the latest booking summary, payment status, meeting point, and confirmation stage.</p>
          </div>
          <form onSubmit={(event) => { event.preventDefault(); searchBooking(); }} className="premium-surface rounded-[1.75rem] p-4 sm:p-5">
            <label className="grid gap-2 text-sm font-semibold text-foreground">
              Booking reference number
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-3.5 size-4 text-muted-foreground" aria-hidden="true" />
                <Input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="ED-20260707-007" className="h-12 rounded-2xl pl-11 font-semibold uppercase" />
              </div>
            </label>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button type="submit" className="rounded-full"><Search data-icon aria-hidden="true" />Search Booking</Button>
              <Button asChild type="button" variant="outline" className="rounded-full"><a href={`${whatsappUrl}?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer"><MessageCircle data-icon aria-hidden="true" />Ask WhatsApp</a></Button>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">Example: ED-20260707-007. Your reference is shown after submitting the booking form.</p>
          </form>
        </div>

        <div className="mt-7">
          {result ? <StatusResult request={result} /> : searched ? <NotFound reference={reference} whatsappMessage={whatsappMessage} /> : <EmptyPreview />}
        </div>
      </div>
    </section>
  );
}

function StatusResult({ request }: { request: BookingRequest }) {
  const experience = getExperience(request.experienceType);
  const isSales = request.serviceType === 'sales_inquiry';
  const totalLabel = isSales ? 'Request quote' : formatAed(request.totalAmount);
  const status = request.status || 'Pending';
  const steps = [
    ['Request Sent', true],
    ['Team Review', status !== 'Cancelled'],
    ['Confirmed', status === 'Confirmed' || status === 'Completed'],
    ['Completed', status === 'Completed']
  ] as const;

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_19rem]">
      <article className="overflow-hidden rounded-[1.75rem] border border-primary-900/10 bg-white shadow-[0_18px_45px_rgba(8,37,50,0.10)]">
        <div className="bg-primary-900 px-5 py-5 text-white sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-heading text-2xl font-semibold leading-none">eDrive</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.32em] text-primary-100">Water Sports</p>
            </div>
            <span className={cn('w-fit rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em]', statusTone(status))}>{status}</span>
          </div>
          <h2 className="mt-4 font-heading text-2xl font-semibold leading-tight sm:text-3xl">{request.bookingCode}</h2>
          <p className="mt-2 text-sm text-white/70">Booking status and request details</p>
        </div>

        <div className="p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <InfoBox icon={TicketCheck} label="Service" value={experience.title} />
            <InfoBox icon={CalendarDays} label="Date" value={displayDate(request.preferredDate)} />
            <InfoBox icon={Clock3} label="Time" value={request.preferredTime || 'Not selected'} nowrap />
            <InfoBox icon={Waves} label="Duration" value={durationLabel(request)} nowrap />
            <InfoBox icon={UserRound} label="Customer" value={request.customerName} />
            <InfoBox icon={CreditCard} label="Payment" value={request.paymentStatus} nowrap />
            <InfoBox icon={TicketCheck} label="Package" value={request.selectedPackageName || request.selectedPackageCategory || 'Custom booking'} wide />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.78fr]">
            <div className="rounded-[1.25rem] border border-primary/12 bg-primary-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Meeting Point</p>
              <p className="mt-2 font-heading text-lg font-semibold text-foreground">{companyInfo.locationName}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{companyInfo.locationAddress}</p>
              <a href={companyInfo.mapLink} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex rounded-full border border-primary/20 bg-white px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary-50">Open in Google Maps</a>
            </div>
            <div className="rounded-[1.25rem] border border-gold/45 bg-primary-900 p-4 text-white">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold">Estimated Total</p>
              <p className="mt-2 font-heading text-3xl font-semibold text-gold">{totalLabel}</p>
              <p className="mt-3 text-xs leading-5 text-white/70">Final availability and payment details are shared by the booking team.</p>
            </div>
          </div>

          <div className="mt-5 rounded-[1.25rem] border border-border bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Booking Progress</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              {steps.map(([label, active], index) => <ProgressStep key={label} label={label} active={active} index={index + 1} />)}
            </div>
          </div>
        </div>
      </article>

      <aside className="grid gap-4">
        <article className="premium-surface rounded-[1.45rem] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Current Stage</p>
          <h3 className="mt-2 font-heading text-xl font-semibold text-foreground">{status === 'Pending' ? 'Pending confirmation' : status}</h3>
          <p className="mt-2 text-xs leading-6 text-muted-foreground">{status === 'Pending' ? 'Your request is waiting for team review. We will contact you to confirm availability.' : 'Your booking status has been updated by the eDrive team.'}</p>
        </article>
        <article className="premium-surface rounded-[1.45rem] p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Need Help?</p>
          <p className="mt-2 text-xs leading-6 text-muted-foreground">Share your reference number with our team on WhatsApp for quick support.</p>
          <Button asChild className="mt-4 w-full rounded-full"><a href={`${whatsappUrl}?text=${encodeURIComponent(`Hello eDrive, I want to check my booking status. Reference: ${request.bookingCode}`)}`} target="_blank" rel="noopener noreferrer"><MessageCircle data-icon aria-hidden="true" />WhatsApp Team</a></Button>
        </article>
      </aside>
    </div>
  );
}

function InfoBox({ icon: Icon, label, value, wide = false, nowrap = false }: { icon: LucideIcon; label: string; value: string; wide?: boolean; nowrap?: boolean }) {
  return <div className={cn('flex min-h-[5.25rem] items-center gap-3 rounded-2xl border border-border bg-white p-3', wide && 'sm:col-span-2 lg:col-span-3')}><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary"><Icon className="size-4" aria-hidden="true" /></span><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p><p className={cn('mt-1 text-sm font-semibold leading-5 text-foreground', nowrap && 'whitespace-nowrap')}>{value}</p></div></div>;
}

function ProgressStep({ label, active, index }: { label: string; active: boolean; index: number }) {
  return <div className={cn('rounded-2xl border p-3', active ? 'border-primary/20 bg-primary-50' : 'border-border bg-white')}><span className={cn('flex size-8 items-center justify-center rounded-full text-xs font-bold', active ? 'bg-primary text-white' : 'bg-muted text-muted-foreground')}>{active ? <CheckCircle2 className="size-4" aria-hidden="true" /> : index}</span><p className="mt-3 text-xs font-bold text-foreground">{label}</p></div>;
}

function NotFound({ reference, whatsappMessage }: { reference: string; whatsappMessage: string }) {
  return <div className="premium-surface mx-auto max-w-2xl rounded-[1.75rem] p-6 text-center"><FileSearch className="mx-auto size-10 text-primary" aria-hidden="true" /><h2 className="mt-4 font-heading text-2xl font-semibold text-foreground">Booking not found</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">We could not find {reference || 'this reference'} in this browser. Please check the reference number or contact the eDrive team on WhatsApp.</p><Button asChild className="mt-5 rounded-full"><a href={`${whatsappUrl}?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer"><MessageCircle data-icon aria-hidden="true" />Ask WhatsApp</a></Button></div>;
}

function EmptyPreview() {
  return <div className="rounded-[1.75rem] border border-dashed border-primary/25 bg-primary-50/55 p-6 text-center"><TicketCheck className="mx-auto size-10 text-primary" aria-hidden="true" /><h2 className="mt-4 font-heading text-2xl font-semibold text-foreground">Enter your reference to begin</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Your booking status, schedule, payment note, and meeting point will appear here after search.</p></div>;
}
