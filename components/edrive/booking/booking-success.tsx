'use client';

import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { CalendarDays, Check, Clock3, Home, MapPin, MessageCircle, RefreshCw, Ship, TicketCheck, Timer, UsersRound, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BookingRequest, formatAed, formatDuration, getExperience } from '@/lib/booking-data';
import { companyInfo, whatsappUrl } from '@/lib/company-info';

function displayDate(value: string) {
  return new Intl.DateTimeFormat('en-AE', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${value}T12:00:00`));
}

export function BookingSuccess({ request, onAnother }: { request: BookingRequest; onAnother: () => void }) {
  const experience = getExperience(request.experienceType);
  const isSales = request.serviceType === 'sales_inquiry';
  const whatsappMessage = encodeURIComponent(`Hello eDrive, I have submitted booking request ${request.bookingCode}.`);
  const durationLabel = isSales ? request.inquiryType ?? 'Sales inquiry' : formatDuration(request.durationMinutes);
  const totalLabel = isSales ? 'Request quote' : formatAed(request.totalAmount);

  return (
    <section className="container-x py-8 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary text-white shadow-lg"><Check className="size-6" strokeWidth={2.5} aria-hidden="true" /></span>
          <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.22em] text-primary">Pending Confirmation</p>
          <h1 className="mt-2 font-heading text-3xl font-semibold text-foreground sm:text-4xl">Booking Request Sent</h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Thank you, {request.customerName}. Our booking team will check availability and contact you shortly.</p>
        </div>

        <div className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1fr)_19rem]">
          <article className="overflow-hidden rounded-[2rem] border border-primary-900/15 bg-white shadow-[0_20px_55px_rgba(8,37,50,0.11)]">
            <div className="grid lg:grid-cols-[1fr_11rem]">
              <div>
                <div className="bg-primary-900 px-6 py-6 text-white sm:px-7">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-heading text-3xl font-semibold leading-none">eDrive</p>
                      <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.34em] text-primary-100">Water Sports</p>
                      <h2 className="mt-5 font-heading text-3xl font-semibold leading-tight sm:text-4xl">Booking Request Sent</h2>
                    </div>
                    <span className="w-fit rounded-full border border-gold/45 bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-gold">Pending Confirmation</span>
                  </div>
                </div>

                <div className="p-5 sm:p-6">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <InfoBox icon={Ship} label="Service" value={experience.title} />
                    {request.selectedPackageName ? <InfoBox icon={TicketCheck} label="Package" value={request.selectedPackageName} /> : null}
                    <InfoBox icon={CalendarDays} label="Date" value={displayDate(request.preferredDate)} />
                    <InfoBox icon={Clock3} label="Time" value={request.preferredTime} />
                    <InfoBox icon={Timer} label={isSales ? 'Inquiry' : 'Duration'} value={durationLabel} />
                    <InfoBox icon={UsersRound} label="Party" value={`${request.vehicleQuantity} ${request.vehicleQuantity === 1 ? 'vehicle' : 'vehicles'} · ${request.guestCount} guests`} />
                    <InfoBox icon={MapPin} label="Meeting point" value={companyInfo.locationName} />
                    <InfoBox icon={Waves} label="Reference" value={request.bookingCode} wide />
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.75fr]">
                    <div className="rounded-[1.35rem] border border-border bg-primary-50 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Marina access</p>
                      <p className="mt-2 font-semibold text-foreground">{companyInfo.locationName}</p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">{companyInfo.locationAddress}</p>
                      <a href={companyInfo.mapLink} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex rounded-full border border-primary/20 bg-white px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary-50">Open in Google Maps</a>
                    </div>
                    <div className="rounded-[1.35rem] border border-gold/45 bg-primary-900 p-4 text-white">
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gold">Estimated total</p>
                      <p className="mt-2 font-heading text-3xl font-semibold text-gold">{totalLabel}</p>
                      <p className="mt-3 text-xs leading-5 text-white/70">No payment was taken. Payment details are shared after confirmation.</p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[1.25rem] border border-primary/10 bg-white p-4 text-sm leading-6 text-muted-foreground">Our team will contact you shortly to confirm your premium water experience details.</div>
                </div>
              </div>

              <aside className="hidden border-l border-dashed border-primary-900/20 bg-[linear-gradient(180deg,#F9FAF8,#E9F8FA)] p-4 lg:block">
                <div className="flex h-full min-h-[26rem] flex-col items-center justify-between rounded-[1.25rem] border border-primary/15 bg-white/70 p-4 text-center">
                  <span className="flex size-16 items-center justify-center rounded-full bg-primary-50 text-primary"><Waves className="size-8" aria-hidden="true" /></span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Experience Card</p>
                    <p className="mt-2 text-[11px] font-bold uppercase leading-5 tracking-[0.14em] text-muted-foreground">Jet Ski & Jet Car<br />Premium Access</p>
                  </div>
                  <div className="w-full rounded-2xl border border-gold/35 bg-gold/10 p-3">
                    <div className="mx-auto h-28 w-16 rounded-md bg-gold/70" />
                    <p className="mt-3 break-all text-[10px] font-bold tracking-[0.12em] text-primary-900">{request.bookingCode}</p>
                  </div>
                </div>
              </aside>
            </div>
          </article>

          <aside className="grid gap-4">
            <article className="premium-surface overflow-hidden rounded-[1.6rem] p-3">
              <div className="relative min-h-[190px] overflow-hidden rounded-[1.2rem] bg-primary-50">
                <iframe title={`${companyInfo.locationName} map`} src={companyInfo.mapEmbedSrc} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="absolute inset-0 h-full w-full border-0" />
              </div>
              <div className="p-4"><p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Meeting point</p><h2 className="mt-1 font-heading text-lg font-semibold text-foreground">{companyInfo.locationName}</h2><p className="mt-1 text-sm text-muted-foreground">{companyInfo.locationAddress}</p></div>
            </article>
            <HelpfulCard title="What happens next" text="Our team reviews your preferred date, time, and fleet availability." />
            <HelpfulCard title="Payment" text="No payment was taken. Payment details are shared only after confirmation." />
          </aside>
        </div>

        <div className="mt-5 flex flex-col items-center justify-between gap-4 rounded-[1.5rem] border border-primary/15 bg-primary-50 p-4 sm:flex-row">
          <div><p className="font-semibold text-foreground">Need to add something?</p><p className="mt-1 text-sm text-muted-foreground">Send the booking team your reference on WhatsApp.</p></div>
          <Button asChild><a href={`${whatsappUrl}?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer"><MessageCircle data-icon aria-hidden="true" />WhatsApp us</a></Button>
        </div>

        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild variant="outline"><Link href="/"><Home data-icon aria-hidden="true" />Back to Home</Link></Button>
          <Button type="button" onClick={onAnother}><RefreshCw data-icon aria-hidden="true" />Book Another Experience</Button>
        </div>
      </div>
    </section>
  );
}

function InfoBox({ icon: Icon, label, value, wide = false }: { icon: LucideIcon; label: string; value: string; wide?: boolean }) {
  return <div className={`flex items-start gap-3 rounded-2xl border border-border bg-white p-3 ${wide ? 'sm:col-span-2' : ''}`}><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary"><Icon className="size-4" aria-hidden="true" /></span><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p><p className="mt-1 text-sm font-semibold leading-5 text-foreground">{value}</p></div></div>;
}

function HelpfulCard({ title, text }: { title: string; text: string }) {
  return <div className="premium-surface rounded-[1.35rem] p-4"><p className="text-sm font-semibold text-foreground">{title}</p><p className="mt-2 text-xs leading-6 text-muted-foreground">{text}</p></div>;
}
