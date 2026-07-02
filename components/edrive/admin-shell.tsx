'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BadgePercent, BarChart3, Bell, CalendarDays, LayoutDashboard, Menu, Package, Search, Ship, UserCog, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminNavItems } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { BrandMark } from './brand';

const iconMap = { LayoutDashboard, CalendarDays, Ship, Package, BadgePercent, BarChart3, UserCog };

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 bg-ocean-abyss p-4 lg:block">
          <div className="flex h-full flex-col">
            <Link href="/admin" className="mb-8 block px-2 pt-2"><BrandMark inverse /></Link>
            <AdminNav pathname={pathname} />
            <div className="mt-auto border-t border-white/15 px-3 pt-5"><p className="text-sm font-semibold text-white">Admin User</p><p className="mt-1 text-xs text-primary-100/70">Operations team</p></div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur-xl">
            <div className="flex h-[76px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <Button variant="outline" size="icon" className="lg:hidden" onClick={() => setOpen((value) => !value)} aria-label="Toggle admin navigation">{open ? <X data-icon aria-hidden="true" /> : <Menu data-icon aria-hidden="true" />}</Button>
                <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Operations</p><h1 className="truncate text-xl font-semibold text-foreground">eDrive Admin</h1></div>
              </div>
              <div className="hidden w-full max-w-sm items-center gap-2 rounded-md border border-input bg-[#F7FBFC] px-3 md:flex"><Search className="size-4 text-muted-foreground" aria-hidden="true" /><Input className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0" placeholder="Search bookings, vehicles, customers" /></div>
              <div className="flex items-center gap-2"><Button variant="outline" size="icon" aria-label="Notifications"><Bell data-icon aria-hidden="true" /></Button><Button asChild size="sm"><Link href="/">View Site</Link></Button></div>
            </div>
            {open ? <div className="border-t border-white/10 bg-ocean-abyss p-4 lg:hidden"><AdminNav pathname={pathname} onNavigate={() => setOpen(false)} /></div> : null}
          </header>
          <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

function AdminNav({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {adminNavItems.map((item) => {
        const Icon = iconMap[item.icon as keyof typeof iconMap];
        const active = pathname === item.href;
        return <Link key={item.href} href={item.href} onClick={onNavigate} className={cn('flex items-center gap-3 rounded-md px-3 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white', active && 'bg-primary text-white shadow-glow')}><Icon className="size-4" aria-hidden="true" />{item.label}</Link>;
      })}
    </nav>
  );
}
