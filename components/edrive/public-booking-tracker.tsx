'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, CheckCircle2, Clock3, CreditCard, MapPin, Search, Ship, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatAed } from '@/lib/booking-data';
import { isValidOptionalEmail, isValidPhone } from '@/lib/public-request-validation';
import { supabase } from '@/lib/supabase-client';

type TrackingResult = {
  booking_code: string;
  booking_number: string | null;
  public_status: string;
  package_name: string;
  service_type: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  customer_name: string;
  total_amount: number | string;
  payment_status: string;
  amount_received: number | string;
  amount_pending: number | string;
  assigned_vehicle: string | null;
  created_at: string | null;
};

const normalSteps = ['Pending', 'Confirmed', 'In Progress', 'Completed'];
const lookupCooldownMs = 3000;

function text(value: unknown, fallback = '') {
  const clean = String(value ?? '').trim();
  return clean || fallback;
}

function amount(value: unknown) {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function niceDate(value: unknown) {
  const clean = text(value);
  if (!clean) return 'To be confirmed';
  return new Intl.DateTimeFormat('en-AE', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Asia/Dubai' }).format(new Date(clean.includes('T') ? clean : `${clean}T12:00:00+04:00`));
}

function statusTone(status: string) {
  const value = status.toLowerCase();
  if (value === 'completed') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (value === 'in progress') return 'border-sky-200 bg-sky-50 text-sky-700';
  if (value === 'confirmed') return 'border-primary/25 bg-primary-50 text-primary';
  if (value === 'no show' || value === 'cancelled') return 'border-red-200 bg-red-50 text-red-700';
  return 'border-amber-200 bg-amber-50 text-amber-700';
}

function Detail({ icon: Icon, label, value, sub }: { icon: typeof CalendarDays; label: string; value: string; sub?: string }) {
  return <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-border/70 bg-white p-4"><span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary"><Icon className="size-5" aria-hidden="true" /></span><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p><p className="mt-1 break-words text-sm font-bold text-foreground">{value}</p>{sub ? <p className="mt-1 break-words text-xs text-muted-foreground">{sub}</p> : null}</div></div>;
}

function Journey({ status }: { status: string }) {
  const terminal = status === 'No Show' || status === 'Cancelled';
  const currentIndex = normalSteps.indexOf(status);

  if (terminal) {
    return <div className="rounded-2xl border border-red-200 bg-red-50 p-4"><p className="text-sm font-bold text-red-700">Booking {status}</p><p className="mt-1 text-xs leading-5 text-red-700">Please contact our team for assistance or a new booking request.</p></div>;
  }

  return <div className="grid gap-2 sm:grid-cols-4">{normalSteps.map((step, index) => { const complete = index <= Math.max(currentIndex, 0); const active = step === status; return <div key={step} className={`rounded-2xl border p-3 ${complete ? 'border-primary/25 bg-primary-50' : 'border-border bg-[#F7FAFA]'}`}><div className="flex items-center gap-2"><span className={`flex size-7 items-center justify-center rounded-full ${complete ? 'bg-primary text-white' : 'bg-white text-muted-foreground'}`}>{complete ? <CheckCircle2 className="size-4" aria-hidden="true" /> : index + 1}</span><p className={`text-xs font-bold ${active ? 'text-primary-900' : complete ? 'text-primary' : 'text-muted-foreground'}`}>{step}</p></div></div>; })}</div>;
}

export function PublicBookingTracker() {
  const [bookingCode, setBookingCode] = useState('');
  const [contact, setContact] = useState('');
  const [website, setWebsite] = useState('');
  const [result, setResult] = useState<TrackingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const lastAttemptRef = useRef(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get('ref');
    if (reference) setBookingCode(reference.trim().toUpperCase().slice(0, 80));
  }, []);

  const contactValid = isValidOptionalEmail(contact) && (contact.includes('@') || isValidPhone(contact));
  const canSearch = bookingCode.trim().length >= 3 && contact.trim().length >= 5 && contactValid && !website;
  const paymentSummary = useMemo(() => {
    if (!result) return null;
    const total = amount(result.total_amount);
    const paid = amount(result.amount_received);
    const pending = amount(result.amount_pending);
    return { total, paid, pending };
  }, [result]);

  async function searchBooking() {
    if (!canSearch) return;
    const now = Date.now();
    if (now - lastAttemptRef.current < lookupCooldownMs) {
      setError('Please wait a few seconds before trying again.');
      return;
    }
    lastAttemptRef.current = now;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const { data, error: lookupError } = await supabase.rpc('track_booking', {
        p_booking_code: bookingCode.trim().slice(0, 80),
        p_contact: contact.trim().slice(0, 160)
      });
      if (lookupError) throw lookupError;
      const row = Array.isArray(data) ? data[0] : null;
      if (!row) setError('Booking not found. Check the booking code and use the same phone number or email entered during booking.');
      else setResult(row as TrackingResult);
    } catch {
      setError('Booking status is temporarily unavailable. Please try again or contact our support team.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[78vh] bg-[radial-gradient(circle_at_top_right,rgba(14,124,134,0.12),transparent_34%),linear-gradient(180deg,#F7FBFC_0%,#FFFFFF_58%,#F4F8F9_100%)] py-12 sm:py-16">
      <section className="container-x">
        <div className="mx-auto max-w-5xl">
          <div className="text-center"><span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-3 py-1.5 text-xs font-bold text-primary shadow-sm"><ShieldCheck className="size-4" aria-hidden="true" />Secure booking lookup</span><h1 className="mt-5 font-heading text-4xl font-semibold text-primary-900 sm:text-5xl">Track your booking</h1><p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">Enter your booking code and the phone number or email used during booking. We only display information linked to a verified match.</p></div>

          <Card className="mx-auto mt-8 max-w-3xl rounded-[1.75rem] border-white/80 bg-white/90 shadow-[0_28px_80px_rgba(8,37,50,0.10)] backdrop-blur-xl">
            <CardContent className="p-5 sm:p-7">
              <input value={website} onChange={(event) => setWebsite(event.target.value)} type="text" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
              <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-bold text-foreground">Booking Code<Input value={bookingCode} onChange={(event) => setBookingCode(event.target.value.toUpperCase().slice(0, 80))} placeholder="Example: ED-2026-001" autoComplete="off" className="h-12 rounded-2xl bg-white" /></label><label className="grid gap-2 text-sm font-bold text-foreground">Phone or Email<Input value={contact} onChange={(event) => setContact(event.target.value.slice(0, 160))} placeholder="Same contact used for booking" autoComplete="email" className="h-12 rounded-2xl bg-white" /></label></div>
              {contact && !contactValid ? <p className="mt-3 text-xs font-semibold text-red-600">Enter a valid phone number or email address.</p> : null}
              {error ? <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700">{error}</p> : null}
              <Button type="button" onClick={searchBooking} disabled={!canSearch || loading} className="mt-5 h-12 w-full rounded-full text-sm"><Search className="size-4" aria-hidden="true" />{loading ? 'Checking booking...' : 'Check Booking Status'}</Button>
              <p className="mt-3 text-center text-[11px] leading-5 text-muted-foreground">For your privacy, booking details will not appear unless both entries match our record.</p>
            </CardContent>
          </Card>

          {result && paymentSummary ? <section className="mt-8 rounded-[1.75rem] border border-white/80 bg-white/92 p-5 shadow-[0_24px_70px_rgba(8,37,50,0.09)] backdrop-blur-xl sm:p-7"><div className="flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Booking {result.booking_code}</p><h2 className="mt-2 font-heading text-2xl font-semibold text-foreground sm:text-3xl">{result.package_name}</h2><p className="mt-2 text-sm text-muted-foreground">Hello {result.customer_name}, here is your latest booking status.</p></div><span className={`w-fit rounded-full border px-3 py-1.5 text-xs font-bold ${statusTone(result.public_status)}`}>{result.public_status}</span></div><div className="mt-5"><h3 className="mb-3 font-heading text-lg font-semibold text-foreground">Booking journey</h3><Journey status={result.public_status} /></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><Detail icon={CalendarDays} label="Date" value={niceDate(result.preferred_date)} sub={text(result.preferred_time, 'Time to be confirmed')} /><Detail icon={Ship} label="Experience" value={result.package_name} sub={text(result.service_type, 'Water sports experience')} /><Detail icon={MapPin} label="Meeting Point" value="Dubai Islands" sub="Final instructions are shared by our team." /><Detail icon={Ship} label="Assigned Vehicle" value={text(result.assigned_vehicle, 'To be assigned')} sub="Vehicle may be assigned shortly before the ride." /><Detail icon={CreditCard} label="Payment" value={result.payment_status} sub={`Paid ${formatAed(paymentSummary.paid)} · Balance ${formatAed(paymentSummary.pending)}`} /><Detail icon={Clock3} label="Booking Total" value={formatAed(paymentSummary.total)} sub={`Created ${niceDate(result.created_at)}`} /></div><div className="mt-5 flex flex-col gap-3 rounded-2xl border border-primary/15 bg-primary-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-bold text-primary-900">Need help with this booking?</p><p className="mt-1 text-xs leading-5 text-primary-900/75">Our team can help with timing, directions and booking updates.</p></div><Button asChild variant="outline" className="rounded-full bg-white"><Link href="/contact">Contact Support</Link></Button></div></section> : null}
        </div>
      </section>
    </div>
  );
}
