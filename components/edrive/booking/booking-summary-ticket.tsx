import type { LucideIcon } from 'lucide-react';
import { CalendarDays, Clock3, MapPin, Ship, UsersRound, Waves } from 'lucide-react';
import { BookingDraft, formatAed, formatDuration, getBookingTotals, getExperience } from '@/lib/booking-data';
import { companyInfo } from '@/lib/company-info';
import { cn } from '@/lib/utils';

function displayDate(value: string) {
  if (!value) return 'Not selected';
  return new Intl.DateTimeFormat('en-AE', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`));
}

export function BookingSummaryTicket({ draft, compact = false }: { draft: BookingDraft; compact?: boolean }) {
  const experience = getExperience(draft.experienceType);
  const totals = getBookingTotals(draft);
  const isSales = experience.serviceType === 'sales_inquiry';
  const totalLabel = isSales ? 'Request quote' : formatAed(totals.totalAmount);

  return (
    <div className={cn('relative mx-auto max-w-[23rem] overflow-visible rounded-[2rem] bg-[#5d3a08] p-[2px] shadow-[0_26px_70px_rgba(90,55,5,0.28)]', compact && 'max-w-full rounded-[1.5rem]')}>
      <TicketNotch position="top" />
      <TicketNotch position="left" />
      <TicketNotch position="right" />
      <TicketNotch position="bottom" />
      <div className="relative overflow-hidden rounded-[1.9rem] border border-[#FFF0B0]/65 bg-[linear-gradient(135deg,#FFF6C9_0%,#F2C75A_20%,#CA8F25_47%,#FFF2B7_66%,#9F6418_100%)] text-[#201305]">
        <div className="absolute inset-0 opacity-45 [background-image:linear-gradient(105deg,rgba(255,255,255,0.55),transparent_23%,transparent_56%,rgba(255,255,255,0.24)),repeating-linear-gradient(90deg,rgba(65,37,4,0.09)_0_1px,transparent_1px_6px)]" />
        <div className="absolute inset-x-0 bottom-0 h-[34%] bg-[linear-gradient(180deg,rgba(25,14,1,0),rgba(34,20,2,0.24))]" />

        <div className="relative px-5 pb-4 pt-6 text-center">
          <p className="font-heading text-[2.25rem] font-semibold leading-none tracking-tight text-[#6d430c] drop-shadow-[0_1px_0_rgba(255,255,255,0.5)]">eDrive</p>
          <p className="mt-1 text-[0.64rem] font-bold uppercase tracking-[0.38em] text-[#0c7880]">Water Sports</p>
          <div className="mx-auto mt-4 flex w-28 items-center justify-center gap-2 text-[#6d430c]"><span className="h-px flex-1 bg-current" /><Waves className="size-4" strokeWidth={1.5} aria-hidden="true" /><span className="h-px flex-1 bg-current" /></div>
          <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-md border border-[#7d5010]/45 bg-[linear-gradient(135deg,#A86E19,#F3CA61,#A86E19)] px-4 py-1.5 text-[0.66rem] font-bold uppercase tracking-[0.24em] text-[#291704] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
            <span className="size-1.5 rounded-full bg-[#3A2406]" />Premium Pass<span className="size-1.5 rounded-full bg-[#3A2406]" />
          </div>
          <h3 className="mt-5 font-heading text-3xl font-semibold uppercase leading-none tracking-[0.03em] text-[#4d2d05]">Booking Summary</h3>
          <p className="mt-2 text-[0.68rem] font-bold uppercase tracking-[0.35em] text-[#8a5a14]">Golden Ticket</p>
        </div>

        <div className={cn('relative px-5 py-2', compact && 'px-4')}>
          <GoldenSummaryRow icon={Ship} label="Service" value={experience.title} />
          <GoldenSummaryRow icon={Clock3} label={isSales ? 'Inquiry' : 'Duration'} value={isSales ? draft.inquiryType : formatDuration(draft.durationMinutes)} />
          <GoldenSummaryRow icon={Waves} label="Vehicles" value={`${draft.vehicleQuantity}`} />
          <GoldenSummaryRow icon={UsersRound} label="Guests" value={`${draft.guestCount}`} />
          <GoldenSummaryRow icon={CalendarDays} label="Date" value={displayDate(draft.preferredDate)} />
          <GoldenSummaryRow icon={Clock3} label="Time" value={draft.preferredTime || 'Not selected'} />
          {!compact ? <GoldenSummaryRow icon={MapPin} label="Meeting point" value={companyInfo.locationName} /> : null}
        </div>

        <div className="relative mx-4 mb-4 mt-3 overflow-hidden rounded-[1.3rem] border border-[#4d2d05]/35 bg-[linear-gradient(135deg,#2d1b03,#7a5011_38%,#f0c65a_100%)] p-4 text-[#fff3be] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
          <div className="absolute inset-0 opacity-35 [background-image:repeating-linear-gradient(160deg,rgba(255,236,170,0.26)_0_1px,transparent_1px_12px)]" />
          <div className="relative flex items-end justify-between gap-4">
            <div>
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.24em] text-[#FFE9A5]">{isSales ? 'Pricing' : 'Estimated total'}</p>
              {!isSales ? <p className="mt-1 text-[0.66rem] font-semibold text-[#FFF8D7]/78">Includes 5% VAT</p> : null}
            </div>
            <p className="text-right font-heading text-3xl font-semibold leading-tight text-[#FFF1A6] drop-shadow">{totalLabel}</p>
          </div>
          <div className="relative mt-4 h-9 overflow-hidden rounded-md border border-[#432806]/60 bg-[#F6C94E] shadow-inner [background-image:repeating-linear-gradient(90deg,#1E1403_0_2px,transparent_2px_5px,#1E1403_5px_6px,transparent_6px_10px)]" />
          {!compact ? <p className="relative mt-4 text-xs font-medium leading-5 text-[#FFF8D7]">No payment is taken now. Our team will confirm availability and final details.</p> : null}
        </div>
      </div>
    </div>
  );
}

function TicketNotch({ position }: { position: 'top' | 'left' | 'right' | 'bottom' }) {
  const classes = {
    top: 'left-1/2 top-0 -translate-x-1/2 -translate-y-1/2',
    bottom: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2',
    left: 'left-0 top-[72%] -translate-x-1/2 -translate-y-1/2',
    right: 'right-0 top-[72%] translate-x-1/2 -translate-y-1/2'
  }[position];

  return <span className={cn('absolute z-10 size-7 rounded-full border border-[#C9962F]/80 bg-background shadow-inner', classes)} aria-hidden="true" />;
}

function GoldenSummaryRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="grid grid-cols-[2.5rem_1fr] gap-3 border-b border-[#6d430c]/18 py-3 last:border-b-0">
      <span className="flex size-10 items-center justify-center rounded-full border border-[#6d430c]/30 bg-[linear-gradient(135deg,#FFF2A5,#D99F27)] text-[#281805] shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_8px_18px_rgba(70,38,2,0.14)]">
        <Icon className="size-4" strokeWidth={2.4} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[0.64rem] font-black uppercase tracking-[0.22em] text-[#7d4b0c]">{label}</p>
        <p className="mt-1 text-sm font-bold leading-5 text-[#2c1a03]">{value}</p>
      </div>
    </div>
  );
}
