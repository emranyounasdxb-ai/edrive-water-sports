import { CalendarDays, Clock3, MapPin, Ship, UsersRound } from 'lucide-react';
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

  return (
    <div className={cn('overflow-hidden rounded-[1.75rem] border border-white/90 bg-white/86 shadow-[0_18px_45px_rgba(8,37,50,0.08)] backdrop-blur', compact && 'rounded-[1.35rem]')}>
      <div className="bg-primary-900 px-5 py-4 text-white">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/60">Booking summary</p>
        <p className="mt-1 font-heading text-xl font-semibold">{experience.title}</p>
      </div>
      <div className={cn('space-y-4 p-5', compact && 'space-y-3 p-4')}>
        <SummaryRow icon={Ship} label="Experience" value={experience.serviceType === 'rental' ? formatDuration(draft.durationMinutes) : draft.inquiryType} />
        <SummaryRow icon={UsersRound} label="Party" value={`${draft.vehicleQuantity} ${draft.vehicleQuantity === 1 ? 'vehicle' : 'vehicles'} · ${draft.guestCount} ${draft.guestCount === 1 ? 'guest' : 'guests'}`} />
        <SummaryRow icon={CalendarDays} label="Date" value={displayDate(draft.preferredDate)} />
        <SummaryRow icon={Clock3} label="Time" value={draft.preferredTime || 'Not selected'} />
        {!compact ? <SummaryRow icon={MapPin} label="Meeting point" value={companyInfo.locationName} /> : null}
        <div className="border-t border-dashed border-border pt-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{isSales ? 'Pricing' : 'Estimated total'}</p>
              {!isSales ? <p className="mt-1 text-xs text-muted-foreground">Includes 5% VAT</p> : null}
            </div>
            <p className="font-heading text-xl font-semibold text-primary-900">{isSales ? 'Request quote' : formatAed(totals.totalAmount)}</p>
          </div>
        </div>
        {!compact ? <p className="rounded-xl bg-primary-50 px-3 py-2 text-xs leading-5 text-primary-900">No payment is taken now. Our team will confirm availability and final details.</p> : null}
      </div>
    </div>
  );
}

function SummaryRow({ icon: Icon, label, value }: { icon: typeof Ship; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary"><Icon className="size-4" aria-hidden="true" /></span>
      <div className="min-w-0"><p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">{label}</p><p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p></div>
    </div>
  );
}
