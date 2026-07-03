'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { ArrowRightToLine, CalendarCheck, Eye, Globe2, LayoutDashboard, LockKeyhole, Mail, ShieldCheck, Ship, UserRound, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandMark } from '@/components/edrive/brand';
import { supabase } from '@/lib/supabase-client';

const trustItems = [
  { label: 'Secure staff access', icon: ShieldCheck },
  { label: 'Role-based portal', icon: UserRound },
  { label: 'Operations dashboard', icon: LayoutDashboard }
];

export default function Page() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@edrive.ae');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (loginError) {
      setError('Email ya password sahi nahi hai. Please dobara check karein.');
      return;
    }
    router.push('/admin');
    router.refresh();
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_8%_12%,rgba(14,124,134,0.12),transparent_28%),radial-gradient(circle_at_95%_8%,rgba(200,151,74,0.14),transparent_26%),linear-gradient(135deg,#F5F8F8_0%,#EDF5F5_48%,#F8F2E8_100%)] px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col gap-5">
        <header className="flex items-center justify-between rounded-[1.8rem] border border-white/85 bg-white/72 px-5 py-4 shadow-[0_18px_55px_rgba(8,37,50,0.08)] backdrop-blur-xl sm:px-8">
          <Link href="/" className="w-fit"><BrandMark /></Link>
          <Button asChild variant="outline" className="rounded-full border-gold/55 bg-white/85 px-5 text-primary-900 shadow-sm hover:border-gold hover:bg-white">
            <Link href="/"><Globe2 className="size-4" aria-hidden="true" />Back to website</Link>
          </Button>
        </header>

        <section className="grid flex-1 overflow-hidden rounded-[2rem] border border-white/85 bg-white/70 shadow-[0_28px_90px_rgba(8,37,50,0.13)] backdrop-blur-xl lg:grid-cols-[1fr_0.92fr]">
          <div className="relative min-h-[34rem] overflow-hidden rounded-[2rem] bg-primary-900 p-6 text-white sm:p-9 lg:m-3 lg:min-h-0">
            <img src="/images/admin/login-hero.webp" alt="eDrive Water Sports admin portal" className="absolute inset-0 h-full w-full object-cover object-center" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,26,34,0.58)_0%,rgba(3,41,50,0.36)_36%,rgba(4,57,67,0.08)_68%,rgba(3,34,43,0.20)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_16%,rgba(14,124,134,0.16),transparent_32%),linear-gradient(180deg,rgba(0,0,0,0.03)_0%,rgba(0,0,0,0.05)_44%,rgba(0,0,0,0.22)_100%)]" />
            <div className="absolute inset-x-0 bottom-0 h-[28%] bg-[linear-gradient(180deg,transparent,rgba(9,164,174,0.18))]" />
            <div className="absolute left-0 top-0 h-full w-[58%] bg-[linear-gradient(90deg,rgba(1,23,31,0.36),rgba(1,23,31,0.16),transparent)]" />
            <div className="absolute -right-28 top-10 size-[34rem] rounded-full border border-white/10" />
            <div className="absolute right-8 top-20 size-[27rem] rounded-full border border-primary/20" />

            <div className="relative z-10 flex h-full min-h-[30rem] flex-col justify-between">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-gold/55 bg-primary-900/42 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-gold shadow-[0_12px_30px_rgba(0,0,0,0.16)] backdrop-blur">
                  <ShieldCheck className="size-4 text-gold" aria-hidden="true" /> Secure Portal
                </span>
                <h1 className="mt-8 max-w-xl font-heading text-4xl font-semibold leading-[1.04] text-white drop-shadow-[0_8px_20px_rgba(0,0,0,0.38)] sm:text-5xl xl:text-[3.55rem]">
                  Welcome to <span className="text-primary">eDrive</span><br />Admin
                </h1>
                <div className="mt-6 h-1 w-20 rounded-full bg-gold shadow-[0_8px_20px_rgba(200,151,74,0.28)]" />
                <p className="mt-6 max-w-md text-sm font-semibold leading-7 text-white drop-shadow-[0_4px_14px_rgba(0,0,0,0.34)] sm:text-base">
                  Manage bookings, fleet, staff, customers, and daily operations from one premium control center.
                </p>
              </div>

              <div className="grid max-w-[31rem] gap-3 sm:grid-cols-3">
                {[
                  ['Bookings', CalendarCheck],
                  ['Fleet', Ship],
                  ['Marine ops', Waves]
                ].map(([label, Icon]) => (
                  <div key={String(label)} className="rounded-2xl border border-white/18 bg-primary-900/24 px-4 py-3 shadow-[0_16px_36px_rgba(0,0,0,0.16)] backdrop-blur-md">
                    <Icon className="mb-2 size-5 text-gold" aria-hidden="true" />
                    <p className="text-xs font-bold text-white">{String(label)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center p-5 sm:p-8 lg:p-10">
            <div className="w-full max-w-[34rem] rounded-[2rem] border border-white/90 bg-white/90 p-5 shadow-[0_26px_70px_rgba(8,37,50,0.12),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-xl sm:p-8">
              <div className="mb-8 flex items-center gap-4">
                <span className="flex size-16 items-center justify-center rounded-full border border-gold/30 bg-[linear-gradient(135deg,#15BEC4,#0E7C86)] text-white shadow-[0_18px_35px_rgba(14,124,134,0.25)]"><LockKeyhole className="size-7" aria-hidden="true" /></span>
                <div>
                  <h2 className="font-heading text-3xl font-semibold text-primary-900 sm:text-4xl">Admin Login</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Use your authorized staff account to continue.</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="grid gap-5">
                <label className="grid gap-2 text-sm font-bold text-primary-900">
                  Email
                  <span className="flex h-14 items-center gap-3 rounded-2xl border border-border bg-white px-4 shadow-[0_10px_24px_rgba(8,37,50,0.04)] focus-within:border-primary">
                    <Mail className="size-5 text-muted-foreground" aria-hidden="true" />
                    <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-primary-900 outline-none" />
                  </span>
                </label>

                <label className="grid gap-2 text-sm font-bold text-primary-900">
                  Password
                  <span className="flex h-14 items-center gap-3 rounded-2xl border border-border bg-white px-4 shadow-[0_10px_24px_rgba(8,37,50,0.04)] focus-within:border-primary">
                    <LockKeyhole className="size-5 text-muted-foreground" aria-hidden="true" />
                    <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-primary-900 outline-none" />
                    <Eye className="size-5 text-muted-foreground" aria-hidden="true" />
                  </span>
                </label>

                {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}

                <Button type="submit" disabled={loading} className="mt-2 h-14 rounded-full bg-primary-900 text-base shadow-[0_14px_30px_rgba(4,32,40,0.22)] hover:bg-primary-800">
                  <ArrowRightToLine className="size-5 text-gold" aria-hidden="true" />{loading ? 'Signing in...' : 'Sign in'}
                </Button>
              </form>

              <div className="my-6 flex items-center gap-4"><span className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/45 to-transparent" /><span className="text-gold">✦</span><span className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/45 to-transparent" /></div>

              <div className="grid gap-3 sm:grid-cols-3">
                {trustItems.map(({ label, icon: Icon }) => (
                  <div key={label} className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-white/80 px-3 py-3 text-center text-xs font-bold text-primary-900 shadow-sm">
                    <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
