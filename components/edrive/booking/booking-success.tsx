'use client';

import Link from 'next/link';
import { CalendarDays, Check, Clock3, Home, MapPin, MessageCircle, RefreshCw, Ship, TicketCheck, UsersRound } from 'lucide-react';
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

  return (
    <section className="container-x py-10 sm:py-14 lg:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary text-white shadow-[0_14px_32px_rgba(14,124,134,0.25)]"><Check className="size-8" strokeWidth={2.5} aria-hidden="true" /></span>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-primary">Pending Confirmation</p>
          <h1 className="mt-2 font-heading text-4xl font-semibold text-foreground sm:text-5xl">Booking Request Sent</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">Thank you, {request.customerName}. Our booking team will check availability and contact you shortly.</p>
        </div>

        <div className="mt-9 grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
          <article className="overflow-hidden rounded-[2rem] bg-primary-900 text-white shadow-[0_24px_55px_rgba(8,37,50,0.18)]">
            <div className="flex items-start justify-between gap-5 border-b border-dashed border-white/20 p-6 sm:p-7">
              <div><p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/55">Booking request</p><h2 className="mt-2 font-heading text-2xl font-semibold">{experience.title}</h2></div>
              <TicketCheck className="size-8 text-accent-500" aria-hidden="true" />
            </div>
            <div className="grid gap-5 p-6 sm:grid-cols-2 sm:p-7">
              <TicketItem icon={CalendarDays} label="Preferred date" value={displayDate(request.preferredDate)} />
              <TicketItem icon={Clock3} label="Preferred time" value={request.preferredTime} />
              <TicketItem icon={Ship} label={isSales ? 'Inquiry' : 'Duration'} value={isSales ? request.inquiryType ?? 'Sales inquiry' : formatDuration(request.durationMinutes)} />
              <TicketItem icon={UsersRound} label="Party" value={`${request.vehicleQuantity} ${request.vehicleQuantity === 1 ? 'vehicle' : 'vehicles'} · ${request.guestCount} guests`} />
            </div>
            <div className="flex items-end justify-between gap-4 border-t border-dashed border-white/20 bg-white/[0.04] px-6 py-5 sm:px-7">
              <div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/50">Reference</p><p className="mt-1 font-mono text-lg font-bold tracking-[0.08em]">{request.bookingCode}</p></div>
              <div className="text-right"><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/50">{isSales ? 'Pricing' : 'Estimated total'}</p><p className="mt-1 font-heading text-lg font-semibold text-accent-500">{isSales ? 'Request quote' : formatAed(request.totalAmount)}</p></div>
            </div>
          </article>

          <article className="premium-surface overflow-hidden rounded-[2rem] p-3">
            <div className="relative min-h-[235px] overflow-hidden rounded-[1.45rem] bg-primary-50">
              <iframe title={`${companyInfo.locationName} map`} src={companyInfo.mapEmbedSrc} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="absolute inset-0 h-full w-full border-0" />
            </div>
            <div className="p-4 sm:p-5">
              <div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary"><MapPin className="size-5" aria-hidden="true" /></span><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Meeting point</p><h2 className="mt-1 font-heading text-xl font-semibold text-foreground">{companyInfo.locationName}</h2><p className="mt-1 text-sm text-muted-foreground">{companyInfo.locationAddress}</p></div></div>
              <a href={companyInfo.mapLink} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline">Open in Google Maps</a>
            </div>
          </article>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <HelpfulCard title="What happens next" text="Our team reviews your preferred date, time, and fleet availability." />
          <HelpfulCard title="Confirmation" text="You will receive the final meeting instructions directly by phone or WhatsApp." />
          <HelpfulCard title="Payment" text="No payment was taken. Payment details are shared only after confirmation." />
        </div>

        <div className="mt-6 flex flex-col items-center justify-between gap-5 rounded-[1.75rem] border border-primary/15 bg-primary-50 p-5 sm:flex-row sm:p-6">
          <div><p className="font-semibold text-foreground">Need to add something?</p><p className="mt-1 text-sm text-muted-foreground">Send the booking team your reference on WhatsApp.</p></div>
          <Button asChild><a href={`${whatsappUrl}?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer"><MessageCircle data-icon aria-hidden="true" />WhatsApp us</a></Button>
        </div>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild variant="outline"><Link href="/"><Home data-icon aria-hidden="true" />Back to Home</Link></Button>
          <Button type="button" onClick={onAnother}><RefreshCw data-icon aria-hidden="true" />Book Another Experience</Button>
        </div>
      </div>
    </section>
  );
}

function TicketItem({ icon: Icon, label, value }: { icon: typeof CalendarDays; label: string; value: string }) {
  return <div className="flex items-start gap-3"><Icon className="mt-0.5 size-4 shrink-0 text-accent-500" aria-hidden="true" /><div><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/50">{label}</p><p className="mt-1 text-sm font-semibold text-white">{value}</p></div></div>;
}

function HelpfulCard({ title, text }: { title: string; text: string }) {
  return <div className="premium-surface rounded-[1.5rem] p-5"><p className="text-sm font-semibold text-foreground">{title}</p><p className="mt-2 text-xs leading-6 text-muted-foreground">{text}</p></div>;
}
