import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AgentMetricCard({ label, value, detail, icon: Icon, tone = 'teal' }: {
  label: string;
  value: string;
  detail?: string;
  icon: LucideIcon;
  tone?: 'teal' | 'navy' | 'gold' | 'green' | 'red';
}) {
  const tones = {
    teal: 'bg-teal-50 text-teal-700',
    navy: 'bg-slate-100 text-slate-800',
    gold: 'bg-amber-50 text-amber-700',
    green: 'bg-emerald-50 text-emerald-700',
    red: 'bg-red-50 text-red-700'
  };
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-2 font-heading text-2xl font-semibold text-slate-950">{value}</p>{detail ? <p className="mt-1 text-xs text-slate-500">{detail}</p> : null}</div>
        <span className={cn('flex size-10 items-center justify-center rounded-xl', tones[tone])}><Icon className="size-5" aria-hidden="true" /></span>
      </div>
    </div>
  );
}
