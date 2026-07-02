import type { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
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
  return <Badge variant={statusVariant(status)}>{status}</Badge>;
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return <Badge variant={paymentVariant(status)}>{status}</Badge>;
}

export function CollectionBadge({ status }: { status: CollectionStatus }) {
  return <Badge variant={collectionVariant(status)}>{status}</Badge>;
}

export function PageHeader({ title, description, actions }: { title: string; description: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
      <div>
        <h2 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function SummaryTile({ label, value, detail, icon: Icon, tone = 'aqua' }: { label: string; value: string; detail: string; icon: LucideIcon; tone?: 'aqua' | 'gold' | 'red' }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-center gap-4 p-4">
        <div className={cn('flex size-11 shrink-0 items-center justify-center rounded-full shadow-sm', tone === 'aqua' && 'bg-primary text-primary-foreground', tone === 'gold' && 'bg-accent text-accent-foreground', tone === 'red' && 'bg-destructive text-destructive-foreground')}>
          <Icon aria-hidden="true" className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-0.5 truncate font-heading text-2xl font-semibold text-foreground">{value}</p>
          <p className="mt-0.5 truncate text-[11px] font-medium text-primary">{detail}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export const nativeSelectClassName = 'h-10 w-full rounded-md border border-input bg-white px-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50';
