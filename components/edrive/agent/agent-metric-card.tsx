import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CompactInfoTooltip } from '../shared/overflow-text';

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
    <div className={cn('h-full rounded-xl border bg-white p-2.5 shadow-[0_4px_14px_rgba(15,23,42,0.035)]', primary ? 'border-teal-200 ring-1 ring-teal-100/70' : 'border-slate-200/80')}>
      <div className="flex min-h-9 items-center gap-2.5">
        <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-lg', tones[tone])}><Icon className="size-4" aria-hidden="true" /></span>
        <div className="flex min-w-0 flex-1 items-center justify-between gap-2"><p className="flex min-w-0 items-center gap-1 truncate text-[11px] font-semibold text-slate-500">{label}{detail ? <CompactInfoTooltip content={detail} /> : null}</p><p className={cn('shrink-0 whitespace-nowrap font-heading font-semibold tracking-[-0.025em] text-slate-950', primary ? 'text-xl' : 'text-lg')}>{value}</p></div>
      </div>
    </div>
  );
}
