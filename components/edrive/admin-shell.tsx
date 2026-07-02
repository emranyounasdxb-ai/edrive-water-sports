'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BadgePercent,
  BarChart3,
  Bell,
  CalendarDays,
  LayoutDashboard,
  Menu,
  Package,
  Search,
  Ship,
  UserCog,
  X
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminNavItems } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { BrandMark } from './brand';

const iconMap = {
  LayoutDashboard,
  CalendarDays,
  Ship,
  Package,
  BadgePercent,
  BarChart3,
  UserCog
};

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_15%_0%,rgba(0,212,224,0.16),transparent_28rem),linear-gradient(180deg,#07111A,#0A0F19)]">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-ocean-abyss/[0.72] p-4 backdrop-blur-2xl lg:block">
          <div className="flex h-full flex-col">
            <Link href="/admin" className="mb-8 block px-2 pt-2">
              <BrandMark />
            </Link>
            <AdminNav pathname={pathname} />
            <div className="mt-auto rounded-lg border border-white/10 bg-white/[0.045] p-4">
              <p className="text-sm font-semibold text-pearl">Admin User</p>
              <p className="mt-1 text-xs text-muted-foreground">Operations cockpit</p>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 border-b border-white/10 bg-ocean-abyss/70 backdrop-blur-2xl">
            <div className="flex h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <Button variant="outline" size="icon" className="lg:hidden" onClick={() => setOpen((value) => !value)} aria-label="Toggle admin navigation">
                  {open ? <X data-icon aria-hidden="true" /> : <Menu data-icon aria-hidden="true" />}
                </Button>
                <div>
                  <p className="fine-label">Operations</p>
                  <h1 className="truncate text-xl font-semibold text-pearl sm:text-2xl">eDrive Admin</h1>
                </div>
              </div>
              <div className="hidden w-full max-w-sm items-center gap-2 rounded-md border border-white/10 bg-white/[0.045] px-3 md:flex">
                <Search data-icon aria-hidden="true" className="text-muted-foreground" />
                <Input className="h-10 border-0 bg-transparent px-0 focus-visible:ring-0" placeholder="Search bookings, vehicles, customers" />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" aria-label="Notifications">
                  <Bell data-icon aria-hidden="true" />
                </Button>
                <Button asChild variant="gold" size="sm">
                  <Link href="/">View Site</Link>
                </Button>
              </div>
            </div>
            {open ? (
              <div className="border-t border-white/10 bg-ocean-deep/[0.96] p-4 lg:hidden">
                <AdminNav pathname={pathname} onNavigate={() => setOpen(false)} />
              </div>
            ) : null}
          </header>

          <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

function AdminNav({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-2">
      {adminNavItems.map((item) => {
        const Icon = iconMap[item.icon as keyof typeof iconMap];
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-md border border-transparent px-3 py-3 text-sm font-semibold text-pearl-muted transition hover:border-white/10 hover:bg-white/[0.055] hover:text-pearl',
              active && 'border-primary/[0.35] bg-primary/[0.12] text-ocean-glow shadow-glow'
            )}
          >
            <Icon data-icon aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
