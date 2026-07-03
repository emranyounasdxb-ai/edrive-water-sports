import type { LucideIcon } from 'lucide-react';
import { CalendarDays, Clock3, MapPin, Ship, UsersRound, Waves } from 'lucide-react';
import { BookingDraft, formatAed, formatDuration, getBookingTotals, getExperience, durationPackages } from '@/lib/booking-data';
import { companyInfo } from '@/lib/company-info';
import { cn } from '@/lib/utils';

function displayDate(value: string) {
  if (!value) return 'Not selected';
  return new Intl.DateTimeFormat('en-AE', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${value}T12:00:00`));
}

function getPackagePrice(draft: BookingDraft) {
  const experience = getExperience(draft.experienceType);
  if (experience.serviceType === 'sales_inquiry') return 0;
  return durationPackages[draft.experienceType as 'jet-ski-rental' | 'jet-car-rental'].find((item) => item.minutes === draft.durationMinutes)?.price ?? 0;
}

export function BookingSummaryTicket({ draft, compact = false }: { draft: BookingDraft; compact?: boolean }) {
  const experience = getExperience(draft.experienceType);
  const totals = getBookingTotals(draft);
  const isSales = experience.serviceType === 'sales_inquiry';
  const packagePrice = getPackagePrice(draft);
  const totalLabel = isSales ? 'Request quote' : formatAed(totals.totalAmount);
  const party = `${draft.vehicleQuantity} ${draft.vehicleQuantity === 1 ? 'vehicle' : 'vehicles'} · ${draft.guestCount} ${draft.guestCount === 1 ? 'guest' : 'guests'}`;

  return (
    <div className={cn('mx-auto w-full max-w-[19.5rem] overflow-hidden rounded-[1.65rem] border border-white/80 bg-white shadow-[0_20px_45px_rgba(8,37,50,0.12)]', compact && 'max-w-full rounded-[1.35rem]')}>
      <div className="relative overflow-hidden bg-primary-900 px-4 pb-4 pt-4 text-white">
        <div className="absolute -right-10 -top-12 size-28 rounded-full bg-primary/35 blur-2xl" aria-hidden="true" />
        <div className="absolute -bottom-12 left-6 size-24 rounded-full bg-gold/25 blur-2xl" aria-hidden="true" />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="font-heading text-xl font-semibold leading-none">eDrive</p>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.3em] text-primary-100">Water Sports</p>
          </div>
          <span className="rounded-full border border-gold/45 bg-white/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-gold">Live Summary</span>
        </div>
        <div className="relative mt-4 rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gold">Selected experience</p>
          <h3 className="mt-1 font-heading text-xl font-semibold leading-tight text-white">{experience.title}</h3>
          <p className="mt-2 text-xs leading-5 text-white/72">No payment now. Final details are confirmed by our team.</p>
        </div>
      </div>

      <div className="bg-white p-3.5">
        <div className="grid gap-2">
          <SummaryRow icon={Clock3} label={isSales ? 'Inquiry' : 'Duration'} value={isSales ? draft.inquiryType : formatDuration(draft.durationMinutes)} />
          <SummaryRow icon={UsersRound} label="Party" value={party} />
          <SummaryRow icon={CalendarDays} label="Date" value={displayDate(draft.preferredDate)} />
          <SummaryRow icon={Clock3} label="Time" value={draft.preferredTime || 'Not selected'} />
          {!compact ? <SummaryRow icon={MapPin} label="Meeting point" value={companyInfo.locationName} /> : null}
        </div>
      </div>

      <div className="border-t border-border/70 bg-[#F7F8F8] p-3.5">
        {!isSales ? (
          <div className="mb-3 rounded-[1.15rem] border border-border/80 bg-white p-3">
            <div className="mb-2 flex items-center gap-2">
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Cost Breakdown</p>
              <span className="h-px flex-1 bg-border" />
            </div>
            <BreakdownLine label={`${experience.title} · ${formatDuration(draft.durationMinutes)}`} value={formatAed(packagePrice)} />
            <BreakdownLine label={`Vehicles × ${draft.vehicleQuantity}`} value={formatAed(totals.subtotal)} />
            <BreakdownLine label="Sub Total" value={formatAed(totals.subtotal)} strong />
            <BreakdownLine label="VAT (5%)" value={formatAed(totals.vatAmount)} />
          </div>
        ) : null}
        <div className="rounded-[1.15rem] border border-primary-900/10 bg-primary-900 p-3 text-white">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-gold">{isSales ? 'Pricing' : 'Total price'}</p>
              {!isSales ? <p className="mt-1 text-[10px] font-semibold text-white/60">Includes 5% VAT</p> : null}
            </div>
            <p className="text-right font-heading text-xl font-semibold leading-none text-gold">{totalLabel}</p>
          </div>
          <div className="mt-3 flex items-center justify-between rounded-full border border-white/10 bg-white/10 px-3 py-2 text-[10px] font-semibold text-white/75">
            <span>Website request</span>
            <span>Pending</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[1rem] border border-border/80 bg-white px-3 py-2.5 shadow-[0_4px_12px_rgba(8,37,50,0.035)]">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary"><Icon className="size-4" strokeWidth={2.2} aria-hidden="true" /></span>
      <div className="min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-sm font-semibold leading-5 text-foreground">{value}</p>
      </div>
    </div>
  );
}

function BreakdownLine({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn('flex items-center justify-between gap-3 py-1 text-[11px] leading-4', strong ? 'font-bold text-foreground' : 'font-medium text-muted-foreground')}>
      <span className="min-w-0 truncate">{label}</span>
      <span className="shrink-0 font-semibold text-foreground">{value}</span>
    </div>
  );
}
