'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Anchor, CalendarCheck, Car, Gauge, LayoutDashboard, Percent, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

const nav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/bookings', label: 'Bookings', icon: CalendarCheck },
  { href: '/admin/vehicles', label: 'Vehicles', icon: Car },
  { href: '/admin/inventory', label: 'Inventory', icon: Gauge },
  { href: '/admin/coupons', label: 'Coupons', icon: Percent },
  { href: '/admin/reports', label: 'Reports', icon: Gauge },
  { href: '/admin/staff', label: 'Staff', icon: Users },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace('/login');
      else setReady(true);
    });
  }, [router]);

  if (!ready) {
    return <main className="grid min-h-screen place-items-center bg-ocean-950 text-white">Checking session...</main>;
  }

  return (
    <main className="min-h-screen bg-ocean-radial">
      <aside className="fixed left-0 top-0 hidden h-full w-72 border-r border-white/10 bg-ocean-950/78 p-5 backdrop-blur-xl lg:block">
        <Link href="/admin" className="flex items-center gap-3 text-white">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 text-primary ring-1 ring-white/15"><Anchor className="h-5 w-5" /></span>
          <span className="font-semibold">eDrive Admin</span>
        </Link>
        <nav className="mt-8 space-y-2">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-white/68 transition hover:bg-white/8 hover:text-white">
              <item.icon className="h-4 w-4" /> {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <section className="lg:pl-72">
        <div className="luxury-container py-8">{children}</div>
      </section>
    </main>
  );
}
