'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  BadgePercent,
  BarChart3,
  Bell,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Search,
  Settings,
  Ship,
  User,
  UserCog,
  UsersRound,
  X
} from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminNavItems, managerNavItems } from '@/lib/mock-data';
import { supabase } from '@/lib/supabase-client';
import { cn } from '@/lib/utils';
import { LiveWeatherPill } from './admin/live-weather-pill';
import { OperationsProvider } from './admin/operations-store';
import { BrandMark } from './brand';

const iconMap = {
  LayoutDashboard,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  Ship,
  Package,
  BadgePercent,
  BarChart3,
  UserCog,
  UsersRound,
  MessageSquare,
  Settings
};

const countryCodeByNationality: Record<string, string> = {
  UAE: 'AE',
  'United Arab Emirates': 'AE',
  Pakistan: 'PK',
  India: 'IN',
  Philippines: 'PH',
  Nepal: 'NP',
  'Sri Lanka': 'LK',
  Bangladesh: 'BD',
  Indonesia: 'ID',
  Algeria: 'DZ',
  Egypt: 'EG',
  Jordan: 'JO',
  Syria: 'SY',
  Lebanon: 'LB',
  Morocco: 'MA',
  Kenya: 'KE',
  Uganda: 'UG',
  Ghana: 'GH',
  Nigeria: 'NG',
  Ethiopia: 'ET',
  Tanzania: 'TZ',
  'United Kingdom': 'GB',
  'United States': 'US'
};

const countryAliasByCode: Record<string, string> = {
  AE: 'UAE',
  PK: 'Pakistan',
  IN: 'India',
  PH: 'Philippines',
  NP: 'Nepal',
  LK: 'Sri Lanka',
  BD: 'Bangladesh',
  ID: 'Indonesia',
  DZ: 'Algeria',
  EG: 'Egypt',
  JO: 'Jordan',
  SY: 'Syria',
  LB: 'Lebanon',
  MA: 'Morocco',
  KE: 'Kenya',
  UG: 'Uganda',
  GH: 'Ghana',
  NG: 'Nigeria',
  ET: 'Ethiopia',
  TZ: 'Tanzania',
  GB: 'United Kingdom',
  US: 'United States'
};

type NavItem = { href: string; label: string; icon: string; section?: string };
type PortalUser = { name: string; email: string; role: string; roleLabel: string; avatarUrl: string; nationality: string };
type AdminProfile = { full_name: string | null; email: string | null; role: string | null; status: string | null; avatar_url: string | null; nationality: string | null };

function normalizePath(pathname: string) {
  if (!pathname || pathname === '/') return '/';
  return pathname.replace(/\/$/, '');
}

function displayName(value: string) {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((part) => part ? `${part.charAt(0).toUpperCase()}${part.slice(1)}` : '')
    .join(' ');
}

function isManagerRole(role: string) {
  return role === 'manager';
}

function isActiveStatus(status: string | null | undefined) {
  return String(status || '').trim().toLowerCase() === 'active';
}

function isManagerPathAllowed(pathname: string) {
  return ['/admin/manager', '/admin/my-rides', '/admin/operations-schedule', '/admin/payments'].some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function roleLabel(role: string) {
  const labels: Record<string, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    booking_staff: 'Booking Staff',
    manager: 'Manager',
    finance: 'Finance',
    maintenance_staff: 'Maintenance Staff'
  };
  return labels[role] ?? 'Admin';
}

function bottomLabel(label: string) {
  const map: Record<string, string> = {
    'Today Overview': 'Today',
    'Ride Schedule': 'Schedule'
  };
  return map[label] || label;
}

function countryCode(value: string) {
  const clean = value.trim();
  if (!clean) return '';
  const upper = clean.toUpperCase();
  if (upper.length === 2) return upper;
  return countryCodeByNationality[clean] || '';
}

function countryLabel(value: string) {
  const code = countryCode(value);
  return countryAliasByCode[code] || value;
}

function ProfileFlag({ nationality, compact = false }: { nationality?: string; compact?: boolean }) {
  const code = countryCode(nationality || '');
  if (!code) return null;
  const label = countryLabel(nationality || code);
  return (
    <span title={label} className={cn('inline-flex shrink-0 items-center rounded-[0.3rem] border border-border/80 bg-white p-[1px] shadow-[0_2px_6px_rgba(8,37,50,0.10)]', compact ? 'h-[16px] w-[22px]' : 'h-[18px] w-[26px]')}>
      <img src={`https://flagcdn.com/w40/${code.toLowerCase()}.png`} alt={`${label} flag`} className="h-full w-full rounded-[0.2rem] object-cover" loading="lazy" />
    </span>
  );
}

function ProfileAvatar({ src, size = 'md' }: { src?: string; size?: 'sm' | 'md' | 'lg' }) {
  const className = size === 'lg' ? 'size-14' : size === 'sm' ? 'size-8' : 'size-10';
  const iconSize = size === 'lg' ? 'size-6' : 'size-5';
  return src ? (
    <img src={src} alt="Profile" className={`${className} rounded-full border-2 border-white object-cover shadow-sm`} />
  ) : (
    <div className={`flex ${className} items-center justify-center rounded-full bg-[#F0E6D7] text-primary shadow-sm`}>
      <User className={iconSize} aria-hidden="true" />
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const currentPath = normalizePath(pathname);
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [user, setUser] = useState<PortalUser | null>(null);
  const [ready, setReady] = useState(false);
  const [accessIssue, setAccessIssue] = useState('');
  const isLoginPage = currentPath === '/admin/login';

  useEffect(() => {
    let active = true;

    async function loadUser() {
      if (isLoginPage) {
        setReady(true);
        return;
      }

      setAccessIssue('');
      const { data: sessionData } = await supabase.auth.getSession();
      const authUser = sessionData.session?.user;
      if (!authUser) {
        router.replace('/admin/login');
        return;
      }

      const authEmail = authUser.email || '';
      const queryFilter = authEmail ? `auth_user_id.eq.${authUser.id},email.eq.${authEmail}` : `auth_user_id.eq.${authUser.id}`;
      const { data: profiles, error } = await supabase.from('admin_users').select('full_name,email,role,status,avatar_url,nationality').or(queryFilter).limit(1);
      if (!active) return;

      if (error) {
        setAccessIssue(`Profile read error: ${error.message}`);
        setReady(true);
        return;
      }

      const profile = (profiles?.[0] ?? null) as AdminProfile | null;
      if (!profile) {
        setAccessIssue(`No active admin profile found for ${authEmail || authUser.id}. Check Supabase admin_users profile and policies.`);
        setReady(true);
        return;
      }

      if (!isActiveStatus(profile.status)) {
        setAccessIssue(`Admin profile exists but status is ${profile.status || 'empty'}.`);
        setReady(true);
        return;
      }

      setUser({
        name: profile.full_name ? displayName(profile.full_name) : authEmail || 'Admin',
        email: profile.email || authEmail || '',
        role: profile.role || 'admin',
        roleLabel: roleLabel(profile.role || 'admin'),
        avatarUrl: profile.avatar_url || '',
        nationality: profile.nationality || ''
      });
      setReady(true);
    }

    void loadUser();
    return () => {
      active = false;
    };
  }, [isLoginPage, router]);

  useEffect(() => {
    if (!ready || !user || isLoginPage) return;
    if (isManagerRole(user.role) && !isManagerPathAllowed(currentPath)) {
      router.replace('/admin/manager');
    }
  }, [currentPath, isLoginPage, ready, router, user]);

  const navItems = useMemo(() => (user && isManagerRole(user.role) ? managerNavItems : adminNavItems) as NavItem[], [user]);
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/admin/login');
  };

  if (isLoginPage) return <>{children}</>;
  if (!ready) return <div className="flex min-h-screen items-center justify-center bg-[#F4F7F8] text-sm font-semibold text-muted-foreground">Loading portal...</div>;

  if (accessIssue || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F4F7F8] px-4">
        <div className="w-full max-w-lg rounded-[2rem] border border-border bg-white p-6 text-center shadow-[0_24px_70px_rgba(8,37,50,0.12)]">
          <BrandMark className="mx-auto mb-5 w-fit" />
          <h1 className="font-heading text-2xl font-semibold text-primary-900">Admin access needs attention</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{accessIssue || 'Admin profile could not be loaded.'}</p>
          <p className="mt-3 rounded-2xl bg-primary-50 p-3 text-xs font-semibold text-primary-900">Please check Supabase admin_users profile status and SELECT policy for authenticated users.</p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild variant="outline" className="rounded-full"><Link href="/admin/login">Back to login</Link></Button>
            <Button type="button" className="rounded-full" onClick={handleLogout}>Sign out</Button>
          </div>
        </div>
      </div>
    );
  }

  const isManager = isManagerRole(user.role);

  return (
    <OperationsProvider>
      <div className="min-h-screen bg-[#F4F7F8] text-foreground">
        <div className="flex min-h-screen items-start">
          <aside className={cn('sticky top-0 hidden h-screen shrink-0 overflow-hidden bg-white/82 p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_-10px_0_24px_rgba(8,37,50,0.025),12px_0_35px_rgba(8,37,50,0.055)] ring-1 ring-white/80 backdrop-blur-xl transition-all duration-300 lg:block', collapsed ? 'w-[5.4rem]' : 'w-[15.25rem]')}>
            <div className="flex h-full flex-col">
              <div className={cn('mb-2 flex items-center gap-2', collapsed ? 'justify-center' : 'justify-between px-2')}>
                <Link href={isManager ? '/admin/manager' : '/admin'} prefetch className={cn('block transition', collapsed ? 'flex size-11 items-center justify-center rounded-2xl bg-primary-50 text-sm font-black text-primary shadow-sm' : 'min-w-0 scale-[0.88] origin-left')}>
                  {collapsed ? 'eD' : <BrandMark />}
                </Link>
                <button type="button" onClick={() => setCollapsed((value) => !value)} className="hidden size-8 shrink-0 items-center justify-center rounded-full border border-border bg-white text-muted-foreground shadow-sm transition hover:border-primary/35 hover:text-primary lg:flex" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
                  {collapsed ? <ChevronRight className="size-4" aria-hidden="true" /> : <ChevronLeft className="size-4" aria-hidden="true" />}
                </button>
              </div>

              <AdminNav currentPath={currentPath} navItems={navItems} collapsed={collapsed} />

              {!collapsed ? (
                <div className="premium-surface mt-auto overflow-hidden rounded-[1.2rem] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_10px_24px_rgba(8,37,50,0.07)]">
                  <div className="rounded-[1rem] bg-[linear-gradient(135deg,#EAF8FA,#FFFFFF_50%,#F4E7C7)] p-3 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                    <div className="mx-auto w-fit"><ProfileAvatar src={user.avatarUrl} size="lg" /></div>
                    <div className="mt-2 flex items-center justify-center gap-1.5"><p className="truncate text-sm font-bold text-foreground">{user.name}</p><ProfileFlag nationality={user.nationality} compact /></div>
                    <p className="mt-0.5 text-xs font-semibold text-primary">{user.roleLabel}</p>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{user.email}</p>
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={handleLogout} className="mt-2 w-full rounded-full bg-white text-xs"><LogOut className="size-3.5" aria-hidden="true" />Logout</Button>
                </div>
              ) : (
                <div className="mt-auto flex flex-col items-center gap-2 pb-1">
                  <ProfileAvatar src={user.avatarUrl} size="sm" />
                  <button type="button" onClick={handleLogout} className="flex size-8 items-center justify-center rounded-full border border-border bg-white text-muted-foreground shadow-sm hover:text-primary" aria-label="Logout"><LogOut className="size-4" aria-hidden="true" /></button>
                </div>
              )}
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <header className="sticky top-2 z-40 mx-2 rounded-[1.15rem] bg-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_10px_24px_rgba(8,37,50,0.06)] ring-1 ring-white/80 backdrop-blur-xl sm:top-3 sm:mx-4">
              <div className="flex h-[54px] items-center gap-2 px-2.5 sm:h-[56px] sm:px-5 lg:px-6">
                <Button variant="outline" size="icon" className="size-10 rounded-2xl bg-white lg:hidden" onClick={() => setOpen((value) => !value)} aria-label="Toggle admin navigation">
                  {open ? <X data-icon aria-hidden="true" /> : <Menu data-icon aria-hidden="true" />}
                </Button>

                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="hidden items-center gap-2 rounded-full bg-[#F4F7F8] px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_6px_16px_rgba(8,37,50,0.045)] sm:flex">
                    <Home className="size-4 text-primary" aria-hidden="true" />{isManager ? 'Manager Operations' : 'Admin Operations'}
                  </div>
                  <div className="manager-mobile-avatar sm:hidden"><ProfileAvatar src={user.avatarUrl} size="sm" /></div>
                  <div className="min-w-0 sm:hidden">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <p className="truncate text-sm font-bold leading-tight text-foreground">{user.name}</p>
                      <ProfileFlag nationality={user.nationality} compact />
                    </div>
                    <p className="mt-0.5 truncate text-[11px] font-semibold leading-tight text-primary">{user.roleLabel}</p>
                  </div>
                </div>

                <div className="hidden h-9 w-full max-w-[32rem] items-center gap-2 rounded-2xl border border-white/80 bg-white/92 px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_8px_20px_rgba(8,37,50,0.045)] md:flex">
                  <Search className="size-4 text-muted-foreground" aria-hidden="true" />
                  <Input className="h-8 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0" placeholder="Search bookings, staff, packages, vehicles..." />
                  <span className="rounded-lg border border-border px-2 py-0.5 text-xs text-muted-foreground">/</span>
                </div>

                <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
                  <div className="hidden sm:block"><LiveWeatherPill /></div>
                  <div className="hidden sm:flex sm:gap-2">
                    <IconButtonWithBadge icon={Bell} count="0" />
                    <IconButtonWithBadge icon={MessageSquare} count="0" />
                  </div>
                  <Button asChild size="sm" className="hidden rounded-full px-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_8px_18px_rgba(8,37,50,0.18)] sm:inline-flex"><Link href="/" prefetch>View Site</Link></Button>
                  <button type="button" onClick={handleLogout} className="flex size-10 items-center justify-center rounded-2xl border border-border bg-white text-muted-foreground shadow-sm sm:hidden" aria-label="Logout"><LogOut className="size-4" aria-hidden="true" /></button>
                </div>
              </div>

              {open ? (
                <div className="rounded-b-[1.5rem] bg-white p-3 lg:hidden">
                  <AdminNav currentPath={currentPath} navItems={navItems} onNavigate={() => setOpen(false)} />
                  <Button type="button" variant="outline" className="mt-3 w-full rounded-2xl" onClick={handleLogout}><LogOut className="size-4" aria-hidden="true" />Logout</Button>
                </div>
              ) : null}
            </header>

            <main className={cn('px-2 pb-28 pt-3 sm:px-4 sm:pb-28 sm:pt-5 lg:px-8 lg:pb-8 lg:pt-8', isManager && 'manager-mobile-app')}>{children}</main>
          </div>
        </div>

        <MobileBottomNav currentPath={currentPath} navItems={navItems} isManager={isManager} />
      </div>
    </OperationsProvider>
  );
}

function IconButtonWithBadge({ icon: Icon, count }: { icon: LucideIcon; count?: string }) {
  return (
    <button type="button" className="relative flex size-9 items-center justify-center rounded-full bg-white text-muted-foreground shadow-sm ring-1 ring-border/70 transition hover:text-primary">
      <Icon className="size-4" aria-hidden="true" />
      {count ? <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">{count}</span> : null}
    </button>
  );
}

function AdminNav({ currentPath, navItems, onNavigate, collapsed = false }: { currentPath: string; navItems: NavItem[]; onNavigate?: () => void; collapsed?: boolean }) {
  let previousSection = '';
  return (
    <nav className={cn('flex min-h-0 flex-col overflow-y-auto', collapsed ? 'gap-0.5' : 'gap-0.5 pr-1')}>
      {navItems.map((item) => {
        const Icon = iconMap[item.icon as keyof typeof iconMap] ?? LayoutDashboard;
        const itemPath = normalizePath(item.href.split('?')[0]);
        const active = currentPath === itemPath;
        const showSection = Boolean(item.section && item.section !== previousSection);
        previousSection = item.section || previousSection;
        return (
          <div key={item.href}>
            {showSection && !collapsed ? <p className="mb-1 mt-3 px-2.5 text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground/75 first:mt-0">{item.section}</p> : null}
            {showSection && collapsed && previousSection !== item.section ? <div className="my-1 h-px bg-border/70" /> : null}
            <Link href={item.href} prefetch onClick={onNavigate} title={collapsed ? item.label : undefined} className={cn('flex items-center rounded-xl text-sm font-semibold text-muted-foreground transition hover:bg-primary-50 hover:text-primary-900', collapsed ? 'justify-center px-2 py-1.5' : 'gap-2.5 px-2.5 py-1.5', active && 'bg-primary-100 text-primary-900 shadow-[0px_-3px_0px_0px_rgba(14,124,134,0.08)_inset,0px_2px_0px_0px_rgba(255,255,255,0.65)_inset,0px_8px_18px_rgba(8,37,50,0.07)]')}>
              <span className={cn('flex size-7 shrink-0 items-center justify-center rounded-lg bg-white text-muted-foreground shadow-sm', active && 'bg-[#DDF4F6] text-primary')}><Icon className="size-3.5" aria-hidden="true" /></span>
              {!collapsed ? <span className="truncate">{item.label}</span> : null}
            </Link>
          </div>
        );
      })}
    </nav>
  );
}

function MobileBottomNav({ currentPath, navItems, isManager }: { currentPath: string; navItems: NavItem[]; isManager: boolean }) {
  return (
    <nav className={cn('fixed inset-x-0 bottom-0 z-50 border-t border-white/70 bg-white/92 px-2 pb-[calc(env(safe-area-inset-bottom)+0.45rem)] pt-2 shadow-[0_-16px_38px_rgba(8,37,50,0.12)] backdrop-blur-xl lg:hidden', isManager && 'manager-bottom-nav')}>
      <div className="mx-auto flex max-w-xl items-center justify-around gap-1 rounded-[1.4rem] bg-[#F4F7F8] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
        {navItems.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap] ?? LayoutDashboard;
          const itemPath = normalizePath(item.href.split('?')[0]);
          const active = currentPath === itemPath;
          return (
            <Link key={item.href} href={item.href} prefetch className={cn('flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[1rem] px-1 py-2 text-[10px] font-bold text-muted-foreground transition', active && 'bg-white text-primary-900 shadow-[0_8px_20px_rgba(8,37,50,0.10)]')}>
              <Icon className={cn('size-4', active ? 'text-primary' : 'text-muted-foreground')} aria-hidden="true" />
              <span className="max-w-full truncate leading-none">{bottomLabel(item.label)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
