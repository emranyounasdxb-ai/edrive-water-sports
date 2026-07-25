import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AgentMetricCard({ label, value, detail, icon: Icon, tone = 'teal', primary = false }: {
  label: string;
  value: string;
  detail?: string;
  icon: LucideIcon;
  tone?: 'teal' | 'navy' | 'gold' | 'green' | 'red';
  primary?: boolean;
}) {
  const tones = {
    teal: 'bg-teal-50 text-teal-700',
    navy: 'bg-slate-100 text-slate-800',
    gold: 'bg-amber-50 text-amber-700',
    green: 'bg-emerald-50 text-emerald-700',
    red: 'bg-red-50 text-red-700'
  };
  return (
    <div className={cn('rounded-2xl border bg-white p-4 shadow-[0_8px_22px_rgba(15,23,42,0.045)]', primary ? 'border-teal-200 ring-1 ring-teal-100/70' : 'border-slate-200/80')}>
      <div className="flex min-h-20 items-start justify-between gap-3">
        <div className="min-w-0"><p className="text-xs font-semibold text-slate-500">{label}</p><p className={cn('mt-2 truncate font-heading font-semibold tracking-tight text-slate-950', primary ? 'text-[1.7rem]' : 'text-2xl')}>{value}</p>{detail ? <p className="mt-1 text-xs text-slate-500">{detail}</p> : null}</div>
        <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', tones[tone])}><Icon className="size-5" aria-hidden="true" /></span>
      </div>
    </div>
  );
}
