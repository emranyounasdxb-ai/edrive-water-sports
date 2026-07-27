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
    <div className={cn('h-full rounded-xl border bg-white p-3.5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]', primary ? 'border-teal-200 ring-1 ring-teal-100/70' : 'border-slate-200/80')}>
      <div className="flex min-h-16 items-start justify-between gap-2.5">
        <div className="min-w-0 flex-1"><p className="text-[11px] font-semibold text-slate-500">{label}</p><p className={cn('mt-1.5 whitespace-nowrap font-heading font-semibold tracking-[-0.025em] text-slate-950', primary ? 'text-[1.45rem] xl:text-[1.55rem]' : 'text-xl xl:text-[1.35rem]')}>{value}</p>{detail ? <p className="mt-1 text-[11px] text-slate-500">{detail}</p> : null}</div>
        <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', tones[tone])}><Icon className="size-[1.1rem]" aria-hidden="true" /></span>
      </div>
    </div>
  );
}
