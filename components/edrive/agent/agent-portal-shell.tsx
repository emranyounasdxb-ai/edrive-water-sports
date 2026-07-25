'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpenText, CalendarPlus, CircleHelp, Headphones, LayoutDashboard, LogOut, Menu, WalletCards, X } from 'lucide-react';
import { useState } from 'react';
import { BrandMark } from '@/components/edrive/brand';
import { Button } from '@/components/ui/button';
import { formatAed } from '@/lib/booking-data';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase-client';
import { AgentStatusBadge } from './agent-status-badge';

export type AgentPortalProfile = {
  id: string;
  agent_code: string | null;
  company_name: string;
  contact_person?: string | null;
  login_email?: string | null;
  email?: string | null;
  phone?: string | null;
  status: string;
};

const navigation = [
  { label: 'Dashboard', href: '/agent', icon: LayoutDashboard, exact: true },
  { label: 'New Booking', href: '/agent/new-booking', icon: CalendarPlus },
  { label: 'My Bookings', href: '/agent/bookings', icon: BookOpenText },
  { label: 'Wallet & Ledger', href: '/agent/wallet', icon: WalletCards },
  { label: 'Requests', href: '/agent/requests', icon: CircleHelp }
];

export function AgentPortalShell({ profile, walletBalance, children }: {
  profile: AgentPortalProfile;
  walletBalance?: number | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function logout() {
    await supabase.auth.signOut();
    router.replace('/admin/login');
  }

  const nav = (
    <nav aria-label="Agent portal navigation" className="space-y-1">
      {navigation.map(({ label, href, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={cn('flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400', active ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950')}><Icon className="size-4" aria-hidden="true" />{label}</Link>;
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.10),transparent_30%),#f4f7f8] text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white/95 p-4 backdrop-blur-xl lg:flex lg:flex-col">
        <Link href="/agent" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"><BrandMark className="px-2 py-3" /></Link>
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <p className="truncate text-sm font-bold text-slate-900">{profile.company_name}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2"><span className="text-xs font-mono text-slate-500">{profile.agent_code || 'Partner'}</span><AgentStatusBadge status={profile.status} /></div>
          {walletBalance !== undefined ? <div className="mt-3 border-t border-slate-200 pt-3"><p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Wallet balance</p><p className="mt-1 font-heading text-xl font-semibold text-slate-950">{formatAed(walletBalance || 0)}</p></div> : null}
        </div>
        <div className="mt-5 flex-1">{nav}</div>
        <div className="space-y-2 border-t border-slate-200 pt-4">
          <a href="tel:+97146113114" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"><Headphones className="size-4" />Support · +971 4 611 3114</a>
          <Link href="/contact" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"><CircleHelp className="size-4" />Contact eDrive</Link>
          <button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"><LogOut className="size-4" />Logout</button>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-xl lg:hidden">
        <Link href="/agent"><BrandMark compact /></Link>
        <Button type="button" variant="outline" size="icon" aria-label="Open portal menu" onClick={() => setMobileOpen(true)}><Menu className="size-5" /></Button>
      </header>
      {mobileOpen ? <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm lg:hidden" onMouseDown={() => setMobileOpen(false)}><aside className="h-full w-[86%] max-w-sm bg-white p-4 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}><div className="flex items-center justify-between"><BrandMark compact /><Button type="button" variant="ghost" size="icon" aria-label="Close portal menu" onClick={() => setMobileOpen(false)}><X /></Button></div><div className="my-5 rounded-2xl bg-slate-50 p-3"><p className="font-bold">{profile.company_name}</p><p className="mt-1 text-xs text-slate-500">{profile.agent_code || 'B2B Partner'} · {walletBalance === undefined ? profile.status : formatAed(walletBalance || 0)}</p></div>{nav}<div className="mt-6 border-t pt-4"><a href="tel:+97146113114" className="flex items-center gap-2 py-2 text-sm font-semibold"><Headphones className="size-4" />+971 4 611 3114</a><button type="button" onClick={logout} className="mt-2 flex items-center gap-2 py-2 text-sm font-semibold text-red-700"><LogOut className="size-4" />Logout</button></div></aside></div> : null}

      <main className="pb-24 lg:ml-64 lg:pb-8"><div className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">{children}</div></main>
      <nav aria-label="Mobile portal navigation" className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-slate-200 bg-white/95 px-1 py-1.5 shadow-[0_-8px_25px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
        {navigation.map(({ label, href, icon: Icon, exact }) => { const active = exact ? pathname === href : pathname.startsWith(href); return <Link key={href} href={href} className={cn('flex min-w-0 flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[10px] font-semibold', active ? 'text-teal-700' : 'text-slate-500')}><Icon className="size-4" /><span className="truncate">{label === 'Wallet & Ledger' ? 'Wallet' : label}</span></Link>; })}
      </nav>
    </div>
  );
}
