'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function RouteContentTransition({ children, className }: { children: React.ReactNode; className?: string }) {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setVisible(false);
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return <div className={cn('min-h-[45vh] transition-[opacity,transform] duration-150 ease-out motion-reduce:transform-none motion-reduce:transition-none', visible ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0', className)}>{children}</div>;
}

export function ContentAreaSkeleton({ label, cards = 4 }: { label: string; cards?: number }) {
  return <section aria-label={label} className="animate-pulse space-y-4 py-2"><span className="sr-only">{label}</span><div><div className="h-3 w-24 rounded bg-primary-100" /><div className="mt-3 h-9 w-80 max-w-full rounded bg-slate-200" /><div className="mt-2 h-4 w-[34rem] max-w-full rounded bg-slate-100" /></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: cards }).map((_, index) => <div key={index} className="h-24 rounded-2xl bg-white shadow-sm" />)}</div><div className="h-72 rounded-2xl bg-white shadow-sm" /></section>;
}
