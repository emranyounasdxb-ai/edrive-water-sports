'use client';

import { useState, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Check, ChevronDown, Copy } from 'lucide-react';
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { OverflowText } from './overflow-text';

export function AppInspectorSheet({
  open,
  onOpenChange,
  size = 'md',
  children
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: ReactNode;
}) {
  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent size={size} variant="inspector">{children}</SheetContent></Sheet>;
}

export function AppInspectorHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  badges
}: {
  eyebrow?: string;
  title: string;
  description: string;
  icon?: LucideIcon;
  badges?: ReactNode;
}) {
  return (
    <SheetHeader>
      <div className="flex min-w-0 items-start gap-3">
        {Icon ? <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary"><Icon className="size-4" aria-hidden="true" /></span> : null}
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">{eyebrow ? <p className="truncate text-[10px] font-bold uppercase tracking-[0.14em] text-primary">{eyebrow}</p> : null}{badges}</div>
          <SheetTitle className="mt-1 truncate text-xl">{title}</SheetTitle>
          <SheetDescription className="truncate text-xs">{description}</SheetDescription>
        </div>
      </div>
    </SheetHeader>
  );
}

export function AppInspectorBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5', className)}>{children}</div>;
}

export function AppInspectorFooter({ children, className }: { children: ReactNode; className?: string }) {
  return <SheetFooter className={className}>{children}</SheetFooter>;
}

export function AppInspectorSection({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return <section className={cn('mt-5 first:mt-0', className)}><h3 className="mb-2 text-xs font-bold text-foreground">{title}</h3><div className="overflow-hidden rounded-xl border border-border/70 bg-white">{children}</div></section>;
}

export function AppInspectorRow({
  label,
  value,
  copyable = false,
  mono = false
}: {
  label: string;
  value: ReactNode;
  copyable?: boolean;
  mono?: boolean;
}) {
  const textValue = typeof value === 'string' || typeof value === 'number' ? String(value) : '';
  return <div className="grid min-h-10 gap-1 border-b border-border/60 px-3 py-2 last:border-0 sm:grid-cols-[8.5rem_minmax(0,1fr)] sm:items-center"><span className="text-[11px] font-semibold text-muted-foreground">{label}</span><span className={cn('min-w-0 text-sm font-semibold text-foreground sm:text-right', mono && 'font-mono text-xs')}>{textValue ? <OverflowText value={textValue} maxWidth="max-w-full" copyable={copyable} className="sm:text-right" /> : value}</span></div>;
}

export function AppInspectorTimeline({ items }: { items: Array<{ label: string; time: string }> }) {
  return <ol className="divide-y divide-border/60">{items.map((item, index) => <li key={`${item.time}-${index}`} className="flex min-h-10 items-center justify-between gap-3 px-3 py-2 text-xs"><span className="font-semibold text-foreground">{item.label}</span><time className="text-right text-muted-foreground">{item.time}</time></li>)}</ol>;
}

export function AppInspectorTechnicalDetails({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <section className="mt-5 overflow-hidden rounded-xl border border-border/70 bg-white"><button type="button" className="flex min-h-10 w-full items-center justify-between gap-3 px-3 py-2 text-left text-xs font-bold outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/35" aria-expanded={open} onClick={() => setOpen((current) => !current)}>Technical Details<ChevronDown className={cn('size-4 transition-transform motion-reduce:transition-none', open && 'rotate-180')} /></button>{open ? <div className="border-t border-border/60">{children}</div> : null}</section>;
}

export function CopyInspectorButton({ text, label = 'Copy Details' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }
  return <button type="button" onClick={() => void copy()} className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-white px-3 text-xs font-bold text-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary/35" aria-label={label}>{copied ? <Check className="size-3.5 text-emerald-600" /> : <Copy className="size-3.5" />}{copied ? 'Copied' : label}</button>;
}

