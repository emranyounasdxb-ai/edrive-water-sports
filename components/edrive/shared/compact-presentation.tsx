import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

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
      <CardContent className="flex min-h-[82px] items-center gap-3 p-3.5">
        {Icon ? <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary"><Icon className="size-[18px]" /></span> : null}
        <div className="min-w-0">
          <p className="truncate whitespace-nowrap text-[11px] font-semibold text-muted-foreground">{label}</p>
          <p className="mt-1 truncate whitespace-nowrap font-heading text-xl font-semibold tabular-nums text-foreground">{value}</p>
          {detail ? <p className="mt-0.5 truncate whitespace-nowrap text-[10px] text-muted-foreground">{detail}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

export const compactPanelClass = 'rounded-2xl border border-border/80 bg-white shadow-sm';
export const compactFilterGridClass = 'grid gap-2.5 rounded-2xl border border-border/80 bg-white p-3.5 shadow-sm';
