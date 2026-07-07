'use client';

import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { CalendarDays, Check, Clock3, CreditCard, Home, MapPin, MessageCircle, RefreshCw, Ship, TicketCheck, Timer, UsersRound, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BookingRequest, formatAed, getExperience } from '@/lib/booking-data';
import { companyInfo, whatsappUrl } from '@/lib/company-info';

function displayDate(value: string) {
  return new Intl.DateTimeFormat('en-AE', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${value}T12:00:00`));
}

function shortDuration(minutes: number) {
  return minutes < 60 ? `${minutes} min` : minutes === 60 ? '60 min' : `${minutes / 60} hrs`;
}

export function BookingSuccess({ request, onAnother }: { request: BookingRequest; onAnother: () => void }) {
  const experience = getExperience(request.experienceType);
  const isSales = request.serviceType === 'sales_inquiry';
  const whatsappMessage = encodeURIComponent(`Hello eDrive, I have submitted booking request ${request.bookingCode}.`);
  const durationLabel = isSales ? request.inquiryType ?? 'Sales inquiry' : shortDuration(request.durationMinutes);
  const totalLabel = isSales ? 'Request quote' : formatAed(request.totalAmount);
  const partyLabel = `${request.vehicleQuantity} ${request.vehicleQuantity === 1 ? 'vehicle' : 'vehicles'} · ${request.guestCount} guests`;

  return (
    <section className="container-x py-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-primary text-white shadow-lg"><Check className="size-5" strokeWidth={2.6} aria-hidden="true" /></span>
          <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.24em] text-primary">Pending Confirmation</p>
          <h1 className="mt-1 font-heading text-3xl font-semibold leading-tight text-foreground sm:text-4xl">Booking Request Sent</h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Thank you, {request.customerName}. Our booking team will check availability and contact you shortly.</p>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_18.5rem]">
          <article className="overflow-hidden rounded-[1.75rem] border border-primary-900/10 bg-white shadow-[0_18px_45px_rgba(8,37,50,0.10)]">
            <div className="bg-primary-900 px-5 py-5 text-white sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-heading text-2xl font-semibold leading-none">eDrive</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.32em] text-primary-100">Water Sports</p>
                </div>
                <span className="w-fit rounded-full border border-gold/45 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-gold">Pending Confirmation</span>
              </div>
              <h2 className="mt-4 font-heading text-2xl font-semibold leading-tight sm:text-3xl">Booking Request Sent</h2>
            </div>

            <div className="p-4 sm:p-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <InfoBox icon={Ship} label="Service" value={experience.title} />
                <InfoBox icon={CalendarDays} label="Date" value={displayDate(request.preferredDate)} />
                <InfoBox icon={Clock3} label="Time" value={request.preferredTime} nowrap />
                <InfoBox icon={Timer} label={isSales ? 'Inquiry' : 'Duration'} value={durationLabel} nowrap />
                <InfoBox icon={UsersRound} label="Party" value={partyLabel} nowrap />
                <InfoBox icon={Waves} label="Reference" value={request.bookingCode} nowrap />
                {request.selectedPackageName ? <InfoBox icon={TicketCheck} label="Package" value={request.selectedPackageName} wide /> : null}
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
                  <p className="mt-3 text-xs leading-5 text-white/70">No payment was taken. Payment details are shared after confirmation.</p>
                </div>
              </div>

              <div className="mt-4 rounded-[1.15rem] border border-primary/10 bg-white px-4 py-3 text-sm leading-6 text-muted-foreground">Our team will contact you shortly to confirm your booking details.</div>
            </div>
          </article>

          <aside className="grid gap-4">
            <article className="premium-surface overflow-hidden rounded-[1.45rem] p-3">
              <div className="relative min-h-[172px] overflow-hidden rounded-[1.1rem] bg-primary-50">
                <iframe title={`${companyInfo.locationName} map`} src={companyInfo.mapEmbedSrc} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="absolute inset-0 h-full w-full border-0" />
              </div>
              <div className="p-3"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Meeting Point</p><h2 className="mt-1 font-heading text-lg font-semibold text-foreground">{companyInfo.locationName}</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">{companyInfo.locationAddress}</p></div>
            </article>
            <article className="premium-surface rounded-[1.35rem] p-4">
              <HelpfulLine icon={TicketCheck} title="What happens next" text="Our team reviews your preferred date, time, and fleet availability." />
              <div className="my-3 h-px bg-border" />
              <HelpfulLine icon={CreditCard} title="Payment" text="No payment was taken. Payment details are shared only after confirmation." />
            </article>
          </aside>
        </div>

        <div className="mt-5 flex flex-col items-center justify-between gap-4 rounded-[1.35rem] border border-primary/15 bg-primary-50 p-4 sm:flex-row">
          <div><p className="font-semibold text-foreground">Need to add something?</p><p className="mt-1 text-sm text-muted-foreground">Send the booking team your reference on WhatsApp.</p></div>
          <Button asChild><a href={`${whatsappUrl}?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer"><MessageCircle data-icon aria-hidden="true" />WhatsApp us</a></Button>
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
