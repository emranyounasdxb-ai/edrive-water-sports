import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { uiLabel } from '@/lib/ui-labels';
import type { BookingStatus, CollectionStatus, PaymentStatus } from './operations-data';

type BadgeVariant = 'success' | 'warning' | 'gold' | 'destructive' | 'secondary' | 'default';

export function statusVariant(status: BookingStatus): BadgeVariant {
  if (['Confirmed', 'Ready', 'Completed'].includes(status)) return 'success';
  if (['Contacted', 'In Progress', 'Rescheduled'].includes(status)) return 'default';
  if (['New / Pending', 'Refund Pending'].includes(status)) return 'warning';
  if (['Cancelled', 'No Show'].includes(status)) return 'destructive';
  if (status === 'Refunded') return 'secondary';
  return 'secondary';
}

export function paymentVariant(status: PaymentStatus): BadgeVariant {
  if (status === 'Paid') return 'success';
  if (status === 'Partial Paid' || status === 'Refund Pending') return 'gold';
  if (status === 'Unpaid') return 'destructive';
  return 'secondary';
}

export function collectionVariant(status: CollectionStatus): BadgeVariant {
  if (status === 'Verified by Finance') return 'success';
  if (status === 'Deposited') return 'default';
  if (status === 'Pending Collection') return 'warning';
  return 'gold';
}

export function StatusBadge({ status }: { status: BookingStatus }) {
  return <Badge variant={statusVariant(status)}>{uiLabel(status)}</Badge>;
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return <Badge variant={paymentVariant(status)}>{uiLabel(status)}</Badge>;
}

export function CollectionBadge({ status }: { status: CollectionStatus }) {
  return <Badge variant={collectionVariant(status)}>{uiLabel(status)}</Badge>;
}

export function PageHeader({ title, description, actions }: { title: string; description: string; actions?: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col justify-between gap-3 lg:flex-row lg:items-end">
      <div className="min-w-0">
        <h2 className="truncate whitespace-nowrap font-heading text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
        <p className="mt-1 max-w-3xl truncate text-[13px] text-muted-foreground">{description}</p>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function SummaryTile({ label, value, detail, icon: Icon, tone = 'aqua' }: { label: string; value: string; detail: string; icon: LucideIcon; tone?: 'aqua' | 'gold' | 'red' }) {
  return (
    <Card className="overflow-hidden rounded-2xl">
      <CardContent className="flex min-h-[82px] items-center gap-3 p-3.5">
        <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl shadow-sm', tone === 'aqua' && 'bg-primary text-primary-foreground', tone === 'gold' && 'bg-accent text-accent-foreground', tone === 'red' && 'bg-destructive text-destructive-foreground')}>
          <Icon aria-hidden="true" className="size-[18px]" />
        </div>
        <div className="min-w-0">
          <p className="truncate whitespace-nowrap text-[11px] font-medium text-muted-foreground">{label}</p>
          <p className="mt-0.5 truncate whitespace-nowrap font-heading text-xl font-semibold tabular-nums text-foreground">{value}</p>
          <p className="mt-0.5 truncate whitespace-nowrap text-[10px] font-medium text-primary">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export const nativeSelectClassName = 'h-10 w-full rounded-md border border-input bg-white px-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50';
