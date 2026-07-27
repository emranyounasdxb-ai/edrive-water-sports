import type { LucideIcon } from 'lucide-react';
import { WalletCards } from 'lucide-react';
import { formatAed } from '@/lib/booking-data';

export function AgentPageHeader({ eyebrow, title, description, icon: Icon, actions, walletBalance }: {
  eyebrow: string;
  title: string;
  description: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  walletBalance?: number | null;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-200/80 pb-3.5 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-700">
          {Icon ? <Icon className="size-4" aria-hidden="true" /> : null}{eyebrow}
        </div>
        <h1 className="mt-1.5 font-heading text-[1.55rem] font-semibold tracking-tight text-slate-950 xl:text-[1.75rem]">{title}</h1>
        <p className="mt-0.5 max-w-3xl text-[13px] leading-5 text-slate-600">{description}</p>
      </div>
      {actions || walletBalance !== undefined ? <div className="flex shrink-0 flex-wrap items-center gap-2">
        {walletBalance !== undefined ? <div className="flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 shadow-sm lg:hidden"><WalletCards className="size-4 text-teal-700" /><div><p className="text-[10px] font-bold uppercase tracking-wider text-teal-700">Available Balance</p><p className="font-heading text-sm font-semibold text-slate-950">{formatAed(walletBalance || 0)}</p></div></div> : null}
        {actions}
      </div> : null}
    </div>
  );
}
