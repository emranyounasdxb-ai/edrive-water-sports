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
    <div className={cn('relative mx-auto max-w-[21rem] rounded-[1.6rem] border border-primary-900 bg-white shadow-xl', compact && 'max-w-full rounded-[1.25rem]')}>
      <span className="absolute left-1/2 top-0 z-10 size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold bg-background" aria-hidden="true" />
      <div className="overflow-hidden rounded-[1.55rem]">
        <div className="bg-primary-900 px-4 py-4 text-center text-white">
          <p className="font-heading text-2xl font-semibold leading-none">eDrive</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.32em] text-primary-100">Water Sports</p>
          <p className="mx-auto mt-3 inline-flex rounded-full border border-gold/50 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-gold">Premium Booking</p>
        </div>

        <div className="bg-white px-4 py-4">
          <h3 className="text-center font-heading text-xl font-semibold uppercase text-primary-900">Booking Summary</h3>
          <p className="mt-1 text-center text-[10px] font-bold uppercase tracking-[0.26em] text-gold-deep">Experience Card</p>
          <div className="mt-3 rounded-2xl border border-border/80 bg-white px-2">
            <SummaryRow icon={Ship} label="Service" value={experience.title} />
            <SummaryRow icon={Clock3} label={isSales ? 'Inquiry' : 'Duration'} value={isSales ? draft.inquiryType : formatDuration(draft.durationMinutes)} />
            <SummaryRow icon={Waves} label="Vehicles" value={`${draft.vehicleQuantity}`} />
            <SummaryRow icon={UsersRound} label="Guests" value={`${draft.guestCount}`} />
            <SummaryRow icon={CalendarDays} label="Date" value={displayDate(draft.preferredDate)} />
            <SummaryRow icon={Clock3} label="Time" value={draft.preferredTime || 'Not selected'} />
            {!compact ? <SummaryRow icon={MapPin} label="Meeting point" value={companyInfo.locationName} /> : null}
          </div>
        </div>

        <div className="bg-primary-900 px-4 py-4 text-white">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-gold">{isSales ? 'Pricing' : 'Estimated total'}</p>
              {!isSales ? <p className="mt-1 text-[10px] font-semibold text-white/65">Includes 5% VAT</p> : null}
            </div>
            <p className="text-right font-heading text-2xl font-semibold leading-none text-gold">{totalLabel}</p>
          </div>
          <div className="mt-3 h-7 rounded-md border border-gold/50 bg-gold/80" />
          {!compact ? <p className="mt-3 text-[11px] font-medium leading-5 text-white/82">No payment is taken now. Our team will confirm availability.</p> : null}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="grid grid-cols-[2.1rem_1fr] gap-2.5 border-b border-border/70 py-2.5 last:border-b-0">
      <span className="flex size-8 items-center justify-center rounded-xl border border-primary/10 bg-primary-50 text-primary"><Icon className="size-4" strokeWidth={2.3} aria-hidden="true" /></span>
      <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</p><p className="mt-0.5 text-sm font-bold leading-5 text-foreground">{value}</p></div>
    </div>
  );
}
