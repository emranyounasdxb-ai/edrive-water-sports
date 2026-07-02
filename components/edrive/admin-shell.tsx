'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BadgePercent, BarChart3, Bell, CalendarDays, ChevronDown, Home, LayoutDashboard, Menu, MessageSquare, Package, Search, Settings, Ship, Star, Sun, User, UserCog, Users, WalletCards, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminNavItems } from '@/lib/mock-data';
import { cn } from '@/lib/utils';
import { BrandMark } from './brand';

const iconMap = { LayoutDashboard, CalendarDays, Ship, Package, BadgePercent, BarChart3, UserCog };
const extraNavItems = [
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/payments', label: 'Payments', icon: WalletCards },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/settings', label: 'Settings', icon: Settings }
];

function normalizePath(pathname: string) {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/$/, '');
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const currentPath = normalizePath(pathname);
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F4F7F8] text-foreground">
      <div className="flex min-h-screen">
        <aside className="hidden w-[17rem] shrink-0 border-r border-border/70 bg-white/88 p-4 backdrop-blur-xl lg:block">
          <div className="flex h-full flex-col">
            <Link href="/admin" className="mb-7 block px-3 pt-2">
              <BrandMark />
            </Link>
            <AdminNav currentPath={currentPath} />
            <div className="premium-surface mt-auto overflow-hidden rounded-[1.5rem] p-4">
              <div className="mb-4 h-24 rounded-[1.15rem] bg-[linear-gradient(135deg,#EAF8FA,#FFFFFF_48%,#F4E7C7)] p-4">
                <div className="flex h-full items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-foreground">Premium Water</p>
                    <p className="text-xs text-muted-foreground">Experiences in Dubai</p>
                  </div>
                  <Ship className="size-9 text-primary" aria-hidden="true" />
                </div>
              </div>
              <p className="font-heading text-lg italic text-gold-deep">Drive the Extraordinary</p>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 border-b border-border/70 bg-white/88 backdrop-blur-xl">
            <div className="flex h-[78px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <Button variant="outline" size="icon" className="lg:hidden" onClick={() => setOpen((value) => !value)} aria-label="Toggle admin navigation">
                  {open ? <X data-icon aria-hidden="true" /> : <Menu data-icon aria-hidden="true" />}
                </Button>
                <div className="hidden items-center gap-2 rounded-full bg-[#F4F7F8] px-3 py-2 text-xs font-semibold text-muted-foreground sm:flex">
                  <Home className="size-4 text-primary" aria-hidden="true" />
                  Operations
                </div>
              </div>

              <div className="hidden w-full max-w-[34rem] items-center gap-2 rounded-2xl border border-border/70 bg-white px-4 shadow-[0_10px_24px_rgba(8,37,50,0.04),inset_0_1px_0_rgba(255,255,255,0.9)] md:flex">
                <Search className="size-4 text-muted-foreground" aria-hidden="true" />
                <Input className="h-11 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0" placeholder="Search bookings, guests, vehicles..." />
                <span className="rounded-lg border border-border px-2 py-1 text-xs text-muted-foreground">/</span>
              </div>

              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <IconButtonWithBadge icon={Bell} count="6" />
                <IconButtonWithBadge icon={MessageSquare} count="3" />
                <div className="hidden items-center gap-2 border-l border-border pl-3 text-xs text-muted-foreground xl:flex">
                  <Sun className="size-5 text-gold" aria-hidden="true" />
                  <div><p className="font-bold text-foreground">32°C</p><p>Dubai Marina</p></div>
                  <ChevronDown className="size-4" aria-hidden="true" />
                </div>
                <div className="hidden items-center gap-3 border-l border-border pl-3 md:flex">
                  <div className="flex size-10 items-center justify-center rounded-full bg-[#F0E6D7] text-primary shadow-sm"><User className="size-5" aria-hidden="true" /></div>
                  <div className="hidden lg:block"><p className="text-sm font-bold text-foreground">Admin User</p><p className="text-xs text-muted-foreground">Super Admin</p></div>
                  <ChevronDown className="size-4 text-muted-foreground" aria-hidden="true" />
                </div>
                <Button asChild size="sm" className="hidden sm:inline-flex"><Link href="/">View Site</Link></Button>
              </div>
            </div>
            {open ? <div className="border-t border-border bg-white p-4 lg:hidden"><AdminNav currentPath={currentPath} onNavigate={() => setOpen(false)} /></div> : null}
          </header>
          <main className="px-4 py-5 sm:px-6 lg:px-8 lg:py-7">{children}</main>
        </div>
      </div>
    </div>
  );
}

function IconButtonWithBadge({ icon: Icon, count }: { icon: typeof Bell; count: string }) {
  return (
    <button className="relative flex size-10 items-center justify-center rounded-full bg-white text-muted-foreground shadow-[0_8px_18px_rgba(8,37,50,0.06),inset_0_1px_0_rgba(255,255,255,0.9)] transition hover:text-primary" type="button">
      <Icon className="size-4" aria-hidden="true" />
      <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">{count}</span>
    </button>
  );
}

function AdminNav({ currentPath, onNavigate }: { currentPath: string; onNavigate?: () => void }) {
  const items = [
    ...adminNavItems,
    ...extraNavItems
  ];

  return (
    <nav className="flex flex-col gap-1.5">
      {items.map((item) => {
        const Icon = 'icon' in item && typeof item.icon === 'string' ? iconMap[item.icon as keyof typeof iconMap] : item.icon;
        const active = currentPath === normalizePath(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-muted-foreground transition hover:bg-primary-50 hover:text-primary-900',
              active && 'bg-primary-100 text-primary-900 shadow-[0px_-3px_0px_0px_rgba(14,124,134,0.08)_inset,0px_2px_0px_0px_rgba(255,255,255,0.65)_inset,0px_8px_18px_rgba(8,37,50,0.07)]'
            )}
          >
            <span className={cn('flex size-8 items-center justify-center rounded-xl bg-white text-muted-foreground shadow-sm', active && 'bg-[#DDF4F6] text-primary')}>
              <Icon className="size-4" aria-hidden="true" />
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
