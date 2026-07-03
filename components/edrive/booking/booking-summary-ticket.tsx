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
    <div className={cn('relative overflow-hidden rounded-[1.85rem] border border-[#F4D47B]/80 bg-[#161105] p-[1px] shadow-[0_24px_58px_rgba(69,45,5,0.22)]', compact && 'rounded-[1.35rem]')}>
      <TicketNotch position="top" />
      <TicketNotch position="left" />
      <TicketNotch position="right" />
      <div className="relative overflow-hidden rounded-[1.78rem] border border-[#C28E2D]/80 bg-[radial-gradient(circle_at_20%_0%,#FFF6CE_0%,#E6B94B_28%,#6E4610_55%,#051E27_100%)] text-[#FFF8D7]">
        <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(115deg,rgba(255,255,255,0.2),transparent_24%,transparent_55%,rgba(255,255,255,0.12)),repeating-linear-gradient(90deg,rgba(255,255,255,0.08)_0_1px,transparent_1px_6px)]" />
        <div className="relative border-b border-[#F4D47B]/35 px-5 pb-4 pt-5 text-center">
          <p className="font-heading text-[1.8rem] font-semibold leading-none tracking-tight text-[#FFE9A5] drop-shadow">eDrive</p>
          <p className="mt-1 text-[0.62rem] font-bold uppercase tracking-[0.34em] text-primary-100">Water Sports</p>
          <div className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-[#F4D47B]/55 bg-[#3B2A10]/55 px-3 py-1 text-[0.62rem] font-bold uppercase tracking-[0.24em] text-[#FFE9A5] shadow-inner">
            <span className="size-1.5 rounded-full bg-[#F4D47B]" />Premium Pass<span className="size-1.5 rounded-full bg-[#F4D47B]" />
          </div>
          <h3 className="mt-4 font-heading text-2xl font-semibold uppercase tracking-[0.04em] text-[#FFF5D0]">Booking Summary</h3>
          <p className="mt-1 text-[0.65rem] font-bold uppercase tracking-[0.34em] text-[#F4D47B]">Golden Ticket</p>
        </div>

        <div className={cn('relative space-y-0 px-5 py-4', compact && 'px-4 py-3')}>
          <GoldenSummaryRow icon={Ship} label="Service" value={experience.title} />
          <GoldenSummaryRow icon={Clock3} label={isSales ? 'Inquiry' : 'Duration'} value={isSales ? draft.inquiryType : formatDuration(draft.durationMinutes)} />
          <GoldenSummaryRow icon={Waves} label="Vehicles" value={`${draft.vehicleQuantity}`} />
          <GoldenSummaryRow icon={UsersRound} label="Guests" value={`${draft.guestCount}`} />
          <GoldenSummaryRow icon={CalendarDays} label="Date" value={displayDate(draft.preferredDate)} />
          <GoldenSummaryRow icon={Clock3} label="Time" value={draft.preferredTime || 'Not selected'} />
          {!compact ? <GoldenSummaryRow icon={MapPin} label="Meeting point" value={companyInfo.locationName} /> : null}
        </div>

        <div className="relative border-t border-dashed border-[#FFE9A5]/45 bg-[#061F29]/78 px-5 py-5">
          <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_15%_25%,rgba(244,212,123,0.24),transparent_24%),repeating-linear-gradient(160deg,rgba(244,212,123,0.18)_0_1px,transparent_1px_12px)]" />
          <div className="relative flex items-end justify-between gap-4">
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-[#F4D47B]">{isSales ? 'Pricing' : 'Estimated total'}</p>
              {!isSales ? <p className="mt-1 text-[0.62rem] font-semibold text-[#FFF8D7]/70">Includes 5% VAT</p> : null}
            </div>
            <p className="font-heading text-2xl font-semibold text-[#FFE9A5] drop-shadow">{totalLabel}</p>
          </div>
          <div className="relative mt-4 h-10 overflow-hidden rounded-lg border border-[#F4D47B]/50 bg-[#E6B94B] shadow-inner [background-image:repeating-linear-gradient(90deg,#171000_0_2px,transparent_2px_5px,#171000_5px_6px,transparent_6px_10px)]" />
          {!compact ? <p className="relative mt-4 text-xs leading-5 text-[#FFF8D7]/82">No payment is taken now. Our team will confirm availability and final details.</p> : null}
        </div>
      </div>
    </div>
  );
}

function TicketNotch({ position }: { position: 'top' | 'left' | 'right' }) {
  const classes = {
    top: 'left-1/2 top-0 -translate-x-1/2 -translate-y-1/2',
    left: 'left-0 top-[72%] -translate-x-1/2 -translate-y-1/2',
    right: 'right-0 top-[72%] translate-x-1/2 -translate-y-1/2'
  }[position];

  return <span className={cn('absolute z-10 size-7 rounded-full border border-[#F4D47B]/70 bg-background shadow-inner', classes)} aria-hidden="true" />;
}

function GoldenSummaryRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="grid grid-cols-[2.35rem_1fr] gap-3 border-b border-[#FFE9A5]/20 py-3 last:border-b-0">
      <span className="flex size-9 items-center justify-center rounded-full border border-[#F4D47B]/65 bg-[#F7D36C] text-[#0B2F3A] shadow-[inset_0_1px_0_rgba(255,255,255,0.65),0_8px_20px_rgba(0,0,0,0.16)]">
        <Icon className="size-4" strokeWidth={2.3} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-[#F4D47B]">{label}</p>
        <p className="mt-1 text-sm font-semibold leading-5 text-[#FFF8D7]">{value}</p>
      </div>
    </div>
  );
}
