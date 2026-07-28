import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { CompactInfoTooltip } from './overflow-text';

export function CompactPageHeader({
  eyebrow,
  title,
  description,
  actions,
  className
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn('flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        {eyebrow ? <p className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-primary">{eyebrow}</p> : null}
        <h1 className="mt-1 truncate font-heading text-2xl font-semibold leading-tight text-foreground">{title}</h1>
        {description ? <p className="mt-1 max-w-3xl truncate text-[13px] text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function CompactKpiCard({
  label,
  value,
  icon: Icon,
  detail,
  className
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
  detail?: string;
  className?: string;
}) {
  return (
    <Card className={cn('rounded-2xl border-border/80 bg-white shadow-sm', className)}>
      <CardContent className="flex min-h-[56px] items-center gap-2.5 px-3 py-2">
        {Icon ? <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary"><Icon className="size-4" /></span> : null}
        <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1"><p className="truncate whitespace-nowrap text-[10px] font-semibold text-muted-foreground">{label}</p>{detail ? <CompactInfoTooltip content={detail} label={`About ${label}`} /> : null}</div>
          <p className="shrink-0 whitespace-nowrap font-heading text-[17px] font-semibold tabular-nums text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export const compactPanelClass = 'rounded-2xl border border-border/80 bg-white shadow-sm';
export const compactFilterGridClass = 'grid gap-2.5 rounded-2xl border border-border/80 bg-white p-3.5 shadow-sm';

export function CompactMetricStrip({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5', className)}>{children}</div>;
}

export function CompactSegmentedTabs<T extends string>({
  items,
  value,
  onChange,
  className
}: {
  items: Array<{ value: T; label: string; count?: number; icon?: LucideIcon }>;
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex max-w-full gap-1 overflow-x-auto rounded-xl border border-border/70 bg-white p-1', className)}>
      {items.map((item) => {
        const Icon = item.icon;
        const active = value === item.value;
        return <button key={item.value} type="button" onClick={() => onChange(item.value)} className={cn('inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-[11px] font-bold transition', active ? 'bg-primary-50 text-primary-900' : 'text-muted-foreground hover:bg-muted')} aria-pressed={active}>{Icon ? <Icon className="size-3.5" /> : null}{item.label}{item.count !== undefined ? <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] tabular-nums">{item.count}</span> : null}</button>;
      })}
    </div>
  );
}

export function CompactOperationalRow({ title, secondary, value, action }: { title: React.ReactNode; secondary?: React.ReactNode; value?: React.ReactNode; action?: React.ReactNode }) {
  return <div className="grid min-h-[48px] gap-2 border-b border-border/60 px-3 py-2 last:border-0 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"><div className="min-w-0">{title}{secondary ? <div className="mt-0.5 truncate whitespace-nowrap text-[11px] text-muted-foreground">{secondary}</div> : null}</div>{value ? <div className="whitespace-nowrap text-sm font-bold tabular-nums text-foreground">{value}</div> : null}{action ? <div className="shrink-0">{action}</div> : null}</div>;
}

export function CompactEmptyState({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('flex min-h-[52px] items-center justify-center px-4 py-3 text-center text-xs font-semibold text-muted-foreground', className)}>{children}</div>;
}
