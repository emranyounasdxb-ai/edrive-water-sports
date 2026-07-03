'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { Anchor, ArrowRightToLine, CalendarCheck, Eye, Globe2, LayoutDashboard, LockKeyhole, Mail, ShieldCheck, Ship, UserRound, Waves } from 'lucide-react';
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

        <section className="grid flex-1 overflow-hidden rounded-[2rem] border border-white/85 bg-white/68 shadow-[0_28px_90px_rgba(8,37,50,0.13)] backdrop-blur-xl lg:grid-cols-[1fr_0.92fr]">
          <div className="relative min-h-[34rem] overflow-hidden rounded-[2rem] bg-primary-900 p-6 text-white sm:p-9 lg:m-3 lg:min-h-0">
            <div className="absolute inset-0 bg-[linear-gradient(130deg,rgba(2,31,39,0.98),rgba(7,78,90,0.83)_46%,rgba(13,141,151,0.72)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_12%,rgba(255,255,255,0.22),transparent_24%),radial-gradient(circle_at_25%_88%,rgba(23,205,209,0.38),transparent_34%)]" />
            <div className="absolute inset-x-0 bottom-0 h-[46%] bg-[linear-gradient(180deg,transparent,rgba(8,175,184,0.58))]" />
            <div className="absolute -right-28 top-10 size-[34rem] rounded-full border border-white/10" />
            <div className="absolute right-8 top-20 size-[27rem] rounded-full border border-primary/25" />
            <div className="absolute left-12 top-24 h-40 w-[34rem] rounded-full bg-white/10 blur-3xl" />

            <div className="absolute bottom-14 left-10 right-10 h-28 rounded-[999px] bg-[radial-gradient(ellipse_at_center,rgba(220,255,255,0.38),rgba(0,114,127,0.14)_55%,transparent_72%)]" />
            <div className="absolute bottom-12 left-10 right-10 h-20 bg-[radial-gradient(ellipse_at_center,rgba(46,211,216,0.38),transparent_70%)]" />
            <div className="absolute bottom-9 left-10 right-10 h-16 rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.18),rgba(255,255,255,0.04),rgba(255,255,255,0.18))] opacity-65 blur-sm" />

            <div className="absolute bottom-16 left-[8%] w-[45%] max-w-[24rem]">
              <div className="relative h-28">
                <div className="absolute bottom-2 left-0 h-12 w-[82%] rounded-[2rem] bg-[linear-gradient(100deg,#031E26,#0D7783_48%,#0B303A)] shadow-[0_25px_55px_rgba(0,0,0,0.32)]" />
                <div className="absolute bottom-9 left-[15%] h-10 w-[38%] rounded-t-[3rem] bg-[linear-gradient(100deg,#EDE1C7,#FFFFFF_55%,#0B303A_56%)]" />
                <div className="absolute bottom-4 left-[11%] h-7 w-[36%] rounded-full bg-[#061D25]" />
                <div className="absolute bottom-4 left-[20%] h-5 w-[18%] rounded-full bg-primary" />
                <div className="absolute bottom-0 left-[60%] size-11 rounded-full border-[8px] border-[#051B22] bg-primary" />
                <div className="absolute bottom-0 left-[86%] size-11 rounded-full border-[8px] border-[#051B22] bg-primary" />
                <div className="absolute bottom-14 left-[63%] h-5 w-[28%] rounded-full bg-gold/80" />
              </div>
            </div>

            <div className="absolute bottom-14 right-[6%] w-[43%] max-w-[24rem]">
              <div className="relative h-32">
                <div className="absolute bottom-2 left-0 h-10 w-full rounded-full bg-[linear-gradient(100deg,#051D25,#14C5CA_48%,#062631)] shadow-[0_24px_55px_rgba(0,0,0,0.3)]" />
                <div className="absolute bottom-11 left-[18%] h-10 w-[36%] rounded-full bg-[#EAD8B5]" />
                <div className="absolute bottom-12 left-[42%] h-4 w-[26%] rounded-full bg-primary" />
                <div className="absolute bottom-1 left-[14%] size-8 rounded-full bg-[#04181F]" />
                <div className="absolute bottom-1 right-[12%] size-8 rounded-full bg-[#04181F]" />
                <div className="absolute bottom-18 left-[6%] h-4 w-[30%] rotate-[-8deg] rounded-full bg-white/65" />
              </div>
            </div>

            <div className="relative z-10 flex h-full min-h-[30rem] flex-col justify-between">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-gold/55 bg-primary-900/55 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-gold shadow-[0_12px_30px_rgba(0,0,0,0.14)] backdrop-blur">
                  <ShieldCheck className="size-4 text-gold" aria-hidden="true" /> Secure Portal
                </span>
                <h1 className="mt-8 max-w-xl font-heading text-4xl font-semibold leading-[1.04] text-white sm:text-5xl xl:text-[3.6rem]">
                  Welcome to <span className="text-primary">eDrive</span><br />Admin
                </h1>
                <div className="mt-6 h-1 w-20 rounded-full bg-gold" />
                <p className="mt-6 max-w-md text-sm font-medium leading-7 text-white/84 sm:text-base">
                  Manage bookings, fleet, staff, customers, and daily operations from one premium control center.
                </p>
              </div>

              <div className="grid max-w-[31rem] gap-3 sm:grid-cols-3">
                {[
                  ['Bookings', CalendarCheck],
                  ['Fleet', Ship],
                  ['Marine ops', Waves]
                ].map(([label, Icon]) => (
                  <div key={String(label)} className="rounded-2xl border border-white/14 bg-white/12 px-4 py-3 shadow-[0_16px_36px_rgba(0,0,0,0.16)] backdrop-blur">
                    <Icon className="mb-2 size-5 text-gold" aria-hidden="true" />
                    <p className="text-xs font-bold text-white/90">{String(label)}</p>
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
