'use client';

import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CalendarDays, Check, Clock3, CreditCard, Home, LoaderCircle, MessageCircle, RefreshCw, Ship, TicketCheck, Timer, UsersRound, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BookingRequest, formatAed, getExperience } from '@/lib/booking-data';
import { bookingRequestToLegacyRow, bookingRequestToRow, bookingRequestsTable, isPackageColumnInsertError } from '@/lib/booking-records';
import { companyInfo, whatsappUrl } from '@/lib/company-info';
import { supabase } from '@/lib/supabase-client';

function displayDate(value: string) {
  return new Intl.DateTimeFormat('en-AE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Dubai' }).format(new Date(`${value}T12:00:00+04:00`));
}

function shortDuration(minutes: number) {
  return minutes < 60 ? `${minutes} min` : minutes === 60 ? '60 min' : `${minutes / 60} hrs`;
}

function rpcUnavailable(message: string) {
  const value = message.toLowerCase();
  return value.includes('create_public_booking') && (value.includes('does not exist') || value.includes('schema cache') || value.includes('could not find') || value.includes('pgrst202'));
}

type PublicBookingResult = {
  booking_code: string;
  subtotal: number | string;
  vat_amount: number | string;
  total_amount: number | string;
};

export function BookingSuccess({ request, onAnother }: { request: BookingRequest; onAnother: () => void }) {
  const [savedRequest, setSavedRequest] = useState(request);
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'failed'>('saving');
  const [saveMessage, setSaveMessage] = useState('');
  const [attempt, setAttempt] = useState(0);
  const experience = getExperience(savedRequest.experienceType);
  const isSales = savedRequest.serviceType === 'sales_inquiry';
  const durationLabel = isSales ? savedRequest.inquiryType ?? 'Sales inquiry' : shortDuration(savedRequest.durationMinutes);
  const totalLabel = isSales ? 'Request quote' : formatAed(savedRequest.totalAmount);
  const partyLabel = `${savedRequest.vehicleQuantity} ${savedRequest.vehicleQuantity === 1 ? 'vehicle' : 'vehicles'} · ${savedRequest.guestCount} guests`;
  const whatsappMessage = useMemo(() => encodeURIComponent(`Hello eDrive, I need help with booking request ${savedRequest.bookingCode}.`), [savedRequest.bookingCode]);

  useEffect(() => {
    let active = true;

    async function saveLegacyRequest() {
      const fullResult = await supabase.from(bookingRequestsTable).insert(bookingRequestToRow(request));
      if (!fullResult.error) return { ok: true, message: '' };

      const firstError = fullResult.error.message || '';
      if (!isPackageColumnInsertError(firstError)) return { ok: false, message: firstError };

      const fallbackResult = await supabase.from(bookingRequestsTable).insert(bookingRequestToLegacyRow(request));
      return fallbackResult.error
        ? { ok: false, message: fallbackResult.error.message || firstError }
        : { ok: true, message: '' };
    }

    async function saveBookingRequest() {
      setSaveStatus('saving');
      setSaveMessage('');

      const rpcResult = await supabase.rpc('create_public_booking', {
        p_payload: {
          package_id: request.selectedPackageRateId,
          vehicle_quantity: request.vehicleQuantity,
          guest_count: request.guestCount,
          preferred_date: request.preferredDate,
          preferred_time: request.preferredTime,
          customer_name: request.customerName,
          customer_phone: request.customerPhone,
          customer_email: request.customerEmail,
          customer_hotel_or_area: request.customerHotelOrArea,
          customer_notes: request.customerNotes,
          honeypot: ''
        }
      });

      if (!active) return;
      const rpcRow = Array.isArray(rpcResult.data) ? (rpcResult.data[0] as PublicBookingResult | undefined) : undefined;

      if (!rpcResult.error && rpcRow?.booking_code) {
        setSavedRequest((current) => ({
          ...current,
          bookingCode: String(rpcRow.booking_code),
          subtotal: Number(rpcRow.subtotal || 0),
          vatAmount: Number(rpcRow.vat_amount || 0),
          totalAmount: Number(rpcRow.total_amount || 0)
        }));
        setSaveStatus('saved');
        setSaveMessage('Request received successfully');
        return;
      }

      const rpcMessage = rpcResult.error?.message || 'Booking request could not be submitted.';
      if (!rpcUnavailable(rpcMessage)) {
        setSaveMessage(rpcMessage);
        setSaveStatus('failed');
        return;
      }

      const legacyResult = await saveLegacyRequest();
      if (!active) return;
      if (legacyResult.ok) {
        setSaveStatus('saved');
        setSaveMessage('Request received successfully');
      } else {
        setSaveMessage(legacyResult.message || rpcMessage);
        setSaveStatus('failed');
      }
    }

    void saveBookingRequest();
    return () => { active = false; };
  }, [attempt, request]);

  const heading = saveStatus === 'saving' ? 'Submitting Booking Request' : saveStatus === 'saved' ? 'Booking Request Received' : 'Booking Request Not Sent';
  const HeaderIcon = saveStatus === 'saving' ? LoaderCircle : saveStatus === 'saved' ? Check : AlertCircle;

  return (
    <section className="container-x py-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <span className={`mx-auto flex size-11 items-center justify-center rounded-full text-white shadow-lg ${saveStatus === 'failed' ? 'bg-red-600' : 'bg-primary'}`}><HeaderIcon className={`size-5 ${saveStatus === 'saving' ? 'animate-spin' : ''}`} strokeWidth={2.6} aria-hidden="true" /></span>
          <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.24em] text-primary">{saveStatus === 'saved' ? 'Pending Confirmation' : saveStatus === 'saving' ? 'Secure Submission' : 'Action Required'}</p>
          <h1 className="mt-1 font-heading text-3xl font-semibold leading-tight text-foreground sm:text-4xl">{heading}</h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{saveStatus === 'saved' ? `Thank you, ${savedRequest.customerName}. Our booking team will check availability and contact you shortly.` : saveStatus === 'saving' ? 'Please wait while we securely save your booking request.' : 'Your request has not been recorded yet. Retry below or send the details to our team on WhatsApp.'}</p>
          {saveStatus === 'saving' ? <p className="mx-auto mt-3 w-fit rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-900">Sending your request...</p> : null}
          {saveStatus === 'saved' ? <p className="mx-auto mt-3 w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{saveMessage || 'Request received successfully'}</p> : null}
          {saveStatus === 'failed' ? <div className="mx-auto mt-3 max-w-xl rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-left"><p className="text-sm font-bold text-red-700">We could not save the request automatically.</p><p className="mt-1 text-xs leading-5 text-red-700/85">{saveMessage || 'Please retry or WhatsApp the team.'}</p><Button type="button" size="sm" variant="outline" onClick={() => setAttempt((value) => value + 1)} className="mt-3 rounded-full bg-white"><RefreshCw className="size-3.5" aria-hidden="true" />Retry Submission</Button></div> : null}
        </div>

        <div className={`mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_18.5rem] ${saveStatus !== 'saved' ? 'opacity-90' : ''}`}>
          <article className="overflow-hidden rounded-[1.75rem] border border-primary-900/10 bg-white shadow-[0_18px_45px_rgba(8,37,50,0.10)]">
            <div className="bg-primary-900 px-5 py-5 text-white sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="font-heading text-2xl font-semibold leading-none">eDrive</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[0.32em] text-primary-100">Water Sports</p></div>
                <span className="w-fit rounded-full border border-gold/45 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-gold">{saveStatus === 'saved' ? 'Pending Confirmation' : saveStatus === 'saving' ? 'Submitting' : 'Not Submitted'}</span>
              </div>
              <h2 className="mt-4 font-heading text-2xl font-semibold leading-tight sm:text-3xl">{heading}</h2>
            </div>

            <div className="p-4 sm:p-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <InfoBox icon={Ship} label="Service" value={experience.title} />
                <InfoBox icon={CalendarDays} label="Date" value={displayDate(savedRequest.preferredDate)} />
                <InfoBox icon={Clock3} label="Time" value={`${savedRequest.preferredTime} Dubai`} nowrap />
                <InfoBox icon={Timer} label={isSales ? 'Inquiry' : 'Duration'} value={durationLabel} nowrap />
                <InfoBox icon={UsersRound} label="Party" value={partyLabel} nowrap />
                <InfoBox icon={Waves} label="Reference" value={saveStatus === 'saved' ? savedRequest.bookingCode : 'Generated after submission'} nowrap />
                {savedRequest.selectedPackageName ? <InfoBox icon={TicketCheck} label="Package" value={savedRequest.selectedPackageName} wide /> : null}
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.78fr]">
                <div className="rounded-[1.25rem] border border-primary/12 bg-primary-50 p-4"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Meeting Point</p><p className="mt-2 font-heading text-lg font-semibold text-foreground">{companyInfo.locationName}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{companyInfo.locationAddress}</p><a href={companyInfo.mapLink} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex rounded-full border border-primary/20 bg-white px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary-50">Open in Google Maps</a></div>
                <div className="rounded-[1.25rem] border border-gold/45 bg-primary-900 p-4 text-white"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold">Estimated Total</p><p className="mt-2 font-heading text-3xl font-semibold text-gold">{totalLabel}</p><p className="mt-3 text-xs leading-5 text-white/70">No payment was taken. Payment details are shared after confirmation.</p></div>
              </div>

              <div className="mt-4 rounded-[1.15rem] border border-primary/10 bg-white px-4 py-3 text-sm leading-6 text-muted-foreground">{saveStatus === 'saved' ? 'Our team will contact you shortly to confirm your booking details.' : 'This summary is not a confirmed booking until the request is successfully saved.'}</div>
            </div>
          </article>

          <aside className="grid gap-4">
            <article className="premium-surface overflow-hidden rounded-[1.45rem] p-3"><div className="relative min-h-[172px] overflow-hidden rounded-[1.1rem] bg-primary-50"><iframe title={`${companyInfo.locationName} map`} src={companyInfo.mapEmbedSrc} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="absolute inset-0 h-full w-full border-0" /></div><div className="p-3"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Meeting Point</p><h2 className="mt-1 font-heading text-lg font-semibold text-foreground">{companyInfo.locationName}</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">{companyInfo.locationAddress}</p></div></article>
            <article className="premium-surface rounded-[1.35rem] p-4"><HelpfulLine icon={TicketCheck} title="What happens next" text="Our team reviews your preferred date, time, and fleet availability." /><div className="my-3 h-px bg-border" /><HelpfulLine icon={CreditCard} title="Payment" text="No payment was taken. Payment details are shared only after confirmation." /></article>
          </aside>
        </div>

        <div className="mt-5 flex flex-col items-center justify-between gap-4 rounded-[1.35rem] border border-primary/15 bg-primary-50 p-4 sm:flex-row">
          <div><p className="font-semibold text-foreground">Need to add something?</p><p className="mt-1 text-sm text-muted-foreground">Send the booking team your reference on WhatsApp or check your booking status after submission.</p></div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {saveStatus === 'saved' ? <Button asChild variant="outline"><Link href={`/my-booking?ref=${encodeURIComponent(savedRequest.bookingCode)}`}><TicketCheck data-icon aria-hidden="true" />Check Status</Link></Button> : null}
            <Button asChild><a href={`${whatsappUrl}?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer"><MessageCircle data-icon aria-hidden="true" />WhatsApp us</a></Button>
          </div>
        </div>

        <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild variant="outline"><Link href="/"><Home data-icon aria-hidden="true" />Back to Home</Link></Button>
          <Button type="button" onClick={onAnother}><RefreshCw data-icon aria-hidden="true" />Book Another Experience</Button>
        </div>
      </div>
    </section>
  );
}

function InfoBox({ icon: Icon, label, value, wide = false, nowrap = false }: { icon: LucideIcon; label: string; value: string; wide?: boolean; nowrap?: boolean }) {
  return <div className={`flex min-h-[5.25rem] items-center gap-3 rounded-2xl border border-border bg-white p-3 ${wide ? 'sm:col-span-2 lg:col-span-3' : ''}`}><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary"><Icon className="size-4" aria-hidden="true" /></span><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p><p className={`mt-1 text-sm font-semibold leading-5 text-foreground ${nowrap ? 'whitespace-nowrap' : ''}`}>{value}</p></div></div>;
}

function HelpfulLine({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return <div className="flex gap-3"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary"><Icon className="size-4" aria-hidden="true" /></span><div><p className="text-sm font-semibold text-foreground">{title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{text}</p></div></div>;
}
