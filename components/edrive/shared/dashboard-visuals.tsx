'use client';

import Link from 'next/link';
import { useId, useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CompactEmptyState } from './compact-presentation';

export type DashboardSeries = {
  name: string;
  color: string;
  values: number[];
};

export function DashboardPanel({
  title,
  description,
  action,
  children,
  className
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('min-w-0 rounded-2xl border border-border/70 bg-white shadow-[0_8px_24px_rgba(8,37,50,0.04)]', className)}>
      <header className="flex min-w-0 items-start justify-between gap-3 border-b border-border/60 px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate font-heading text-base font-semibold text-foreground">{title}</h2>
          {description ? <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{description}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      {children}
    </section>
  );
}

export function DashboardAreaChart({
  labels,
  series,
  formatValue = (value) => String(value),
  empty = 'No activity is available for this period.',
  ariaLabel
}: {
  labels: string[];
  series: DashboardSeries[];
  formatValue?: (value: number) => string;
  empty?: string;
  ariaLabel: string;
}) {
  const gradientId = useId().replaceAll(':', '');
  const [active, setActive] = useState<number | null>(null);
  const width = 720;
  const height = 220;
  const inset = { top: 20, right: 16, bottom: 28, left: 16 };
  const usableWidth = width - inset.left - inset.right;
  const usableHeight = height - inset.top - inset.bottom;
  const allValues = series.flatMap((item) => item.values);
  const hasData = labels.length > 0 && allValues.some((value) => value !== 0);
  if (!hasData) return <CompactEmptyState className="min-h-44">{empty}</CompactEmptyState>;
  const max = Math.max(...allValues, 1);
  const x = (index: number) => inset.left + (labels.length === 1 ? usableWidth / 2 : (index / (labels.length - 1)) * usableWidth);
  const y = (value: number) => inset.top + usableHeight - (value / max) * usableHeight;
  const points = (values: number[]) => values.map((value, index) => `${x(index)},${y(value)}`).join(' ');
  const primary = series[0];
  const area = labels.length > 1 ? `${inset.left},${inset.top + usableHeight} ${points(primary.values)} ${inset.left + usableWidth},${inset.top + usableHeight}` : '';

  return (
    <div className="relative px-3 pb-2 pt-3">
      <svg role="img" aria-label={ariaLabel} viewBox={`0 0 ${width} ${height}`} className="h-auto max-h-[220px] w-full overflow-visible">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={primary.color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={primary.color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((ratio) => <line key={ratio} x1={inset.left} x2={width - inset.right} y1={inset.top + usableHeight * ratio} y2={inset.top + usableHeight * ratio} stroke="#dbe7ea" strokeDasharray="3 5" />)}
        {area ? <polygon points={area} fill={`url(#${gradientId})`} /> : null}
        {series.map((item) => (
          <g key={item.name}>
            {labels.length > 1 ? <polyline points={points(item.values)} fill="none" stroke={item.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /> : null}
            {item.values.map((value, index) => <circle key={`${item.name}-${index}`} cx={x(index)} cy={y(value)} r={active === index ? 5 : 3.5} fill="white" stroke={item.color} strokeWidth="2.5" />)}
          </g>
        ))}
        {labels.map((label, index) => (
          <g key={`${label}-${index}`}>
            <rect x={x(index) - Math.max(18, usableWidth / Math.max(labels.length, 1) / 2)} y={0} width={Math.max(36, usableWidth / Math.max(labels.length, 1))} height={height} fill="transparent" tabIndex={0} role="button" aria-label={`${label}: ${series.map((item) => `${item.name} ${formatValue(item.values[index] || 0)}`).join(', ')}`} onFocus={() => setActive(index)} onBlur={() => setActive(null)} onPointerEnter={() => setActive(index)} onPointerLeave={() => setActive(null)} />
            {(index === 0 || index === labels.length - 1 || labels.length <= 7 || index % 2 === 0) ? <text x={x(index)} y={height - 7} textAnchor="middle" className="fill-slate-500 text-[10px]">{label}</text> : null}
          </g>
        ))}
      </svg>
      <div className="flex flex-wrap items-center gap-3 px-1 text-[10px] font-semibold text-muted-foreground">{series.map((item) => <span key={item.name} className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</span>)}</div>
      {active !== null ? <div role="tooltip" className="pointer-events-none absolute right-4 top-3 rounded-lg bg-slate-950 px-3 py-2 text-[11px] text-white shadow-xl"><strong>{labels[active]}</strong>{series.map((item) => <span key={item.name} className="mt-0.5 block">{item.name}: {formatValue(item.values[active] || 0)}</span>)}</div> : null}
    </div>
  );
}

export function DashboardProgressList({ items, formatValue = (value) => String(value), empty }: {
  items: Array<{ label: string; value: number; color?: string }>;
  formatValue?: (value: number) => string;
  empty: string;
}) {
  const max = Math.max(...items.map((item) => item.value), 0);
  if (!items.length || max <= 0) return <CompactEmptyState>{empty}</CompactEmptyState>;
  return <div className="grid gap-3 p-4">{items.map((item) => <div key={item.label}><div className="flex items-center justify-between gap-3 text-xs"><span className="font-semibold text-foreground">{item.label}</span><span className="font-bold tabular-nums">{formatValue(item.value)}</span></div><div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full motion-safe:transition-[width]" style={{ width: `${Math.max(3, (item.value / max) * 100)}%`, backgroundColor: item.color || '#0f8f91' }} /></div></div>)}</div>;
}

export function DashboardActionList({ items, empty = 'All caught up. No items currently need attention.' }: {
  items: Array<{ title: string; meta?: string; value?: string; href: string; tone?: 'warning' | 'critical' | 'info' }>;
  empty?: string;
}) {
  if (!items.length) return <div className="flex min-h-28 items-center gap-2 px-4 py-5 text-xs font-semibold text-emerald-700"><CheckCircle2 className="size-4" />{empty}</div>;
  return <div className="divide-y divide-border/60">{items.map((item, index) => <Link key={`${item.title}-${index}`} href={item.href} className="grid min-h-14 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 px-4 py-2.5 outline-none transition hover:bg-primary-50/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30"><span className={cn('size-2 rounded-full', item.tone === 'critical' ? 'bg-red-500' : item.tone === 'warning' ? 'bg-amber-500' : 'bg-primary')} /><span className="min-w-0"><span className="block truncate text-xs font-bold text-foreground">{item.title}</span>{item.meta ? <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{item.meta}</span> : null}</span><span className="flex items-center gap-2 whitespace-nowrap text-xs font-bold text-primary">{item.value}<ArrowRight className="size-3.5" /></span></Link>)}</div>;
}

export function DashboardActivityList({ items, empty = 'No recent activity is available.' }: {
  items: Array<{ title: string; meta: string; time?: string; icon?: LucideIcon; href?: string }>;
  empty?: string;
}) {
  if (!items.length) return <CompactEmptyState>{empty}</CompactEmptyState>;
  return <div className="divide-y divide-border/60">{items.map((item, index) => {
    const Icon = item.icon;
    const content = <><span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary">{Icon ? <Icon className="size-3.5" /> : <span className="size-2 rounded-full bg-primary" />}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold text-foreground">{item.title}</span><span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{item.meta}</span></span>{item.time ? <time className="shrink-0 text-[10px] font-semibold text-muted-foreground">{item.time}</time> : null}</>;
    return item.href ? <Link key={`${item.title}-${index}`} href={item.href} className="flex min-h-12 items-center gap-2.5 px-4 py-2 outline-none hover:bg-primary-50/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30">{content}</Link> : <div key={`${item.title}-${index}`} className="flex min-h-12 items-center gap-2.5 px-4 py-2">{content}</div>;
  })}</div>;
}

