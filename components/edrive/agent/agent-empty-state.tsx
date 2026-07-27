import type { LucideIcon } from 'lucide-react';

export function AgentEmptyState({ icon: Icon, title, description, action, compact = false }: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center justify-center px-4 text-center ${compact ? 'min-h-28 py-4' : 'min-h-40 py-7'}`}>
      <span className={`flex items-center justify-center rounded-xl bg-teal-50 text-teal-700 ${compact ? 'size-10' : 'size-12'}`}><Icon className="size-5" aria-hidden="true" /></span>
      <h3 className={`${compact ? 'mt-3 text-base' : 'mt-4 text-lg'} font-heading font-semibold text-slate-900`}>{title}</h3>
      <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">{description}</p>
      {action ? <div className={compact ? 'mt-3' : 'mt-4'}>{action}</div> : null}
    </div>
  );
}
