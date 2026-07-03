'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { ArrowRightToLine, Eye, Globe2, LayoutDashboard, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react';
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
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(14,124,134,0.12),transparent_34%),linear-gradient(135deg,#F6F8F8_0%,#ECF4F5_50%,#F6F1E7_100%)] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-7xl flex-col gap-5">
        <header className="flex items-center justify-between rounded-[1.75rem] border border-white/80 bg-white/78 px-5 py-4 shadow-[0_18px_55px_rgba(8,37,50,0.08)] backdrop-blur-xl sm:px-8">
          <Link href="/" className="w-fit"><BrandMark /></Link>
          <Button asChild variant="outline" className="rounded-full border-gold/55 bg-white/80 px-5 text-primary-900 shadow-sm hover:border-gold hover:bg-white">
            <Link href="/"><Globe2 className="size-4" aria-hidden="true" />Back to website</Link>
          </Button>
        </header>

        <section className="grid flex-1 overflow-hidden rounded-[2rem] border border-white/85 bg-white/55 shadow-[0_26px_80px_rgba(8,37,50,0.12)] backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr]">
          <div className="relative min-h-[34rem] overflow-hidden bg-primary-900 p-6 text-white sm:p-9 lg:min-h-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_20%,rgba(255,255,255,0.28),transparent_22%),radial-gradient(circle_at_20%_84%,rgba(14,197,202,0.28),transparent_30%),linear-gradient(120deg,rgba(4,32,40,0.98),rgba(6,48,60,0.78)_46%,rgba(4,32,40,0.38))]" />
            <div className="absolute inset-0 opacity-75 [background-image:linear-gradient(115deg,rgba(6,55,68,0.98)_0%,rgba(8,71,86,0.78)_38%,rgba(229,236,235,0.18)_69%,rgba(3,42,54,0.86)_100%)]" />
            <div className="absolute -right-24 top-8 h-[34rem] w-[34rem] rounded-full border border-primary/30" />
            <div className="absolute right-6 top-16 h-[28rem] w-[28rem] rounded-full border border-white/10" />
            <div className="absolute bottom-0 left-0 right-0 h-[45%] bg-[linear-gradient(180deg,transparent,rgba(7,155,165,0.48))]" />
            <div className="absolute bottom-0 left-0 right-0 h-40 bg-[radial-gradient(ellipse_at_bottom,rgba(46,210,214,0.55),transparent_60%)]" />

            <div className="absolute bottom-8 left-8 right-8 h-40 rounded-[2rem] bg-white/10 blur-2xl" />
            <div className="absolute bottom-10 left-8 h-20 w-[19rem] rounded-[2rem] bg-[linear-gradient(90deg,rgba(4,28,35,0.95),rgba(25,190,195,0.46))] shadow-[0_22px_70px_rgba(0,0,0,0.25)]" />
            <div className="absolute bottom-12 left-10 h-12 w-44 rounded-full bg-[#081C22] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.12)]" />
            <div className="absolute bottom-16 left-20 h-8 w-24 rounded-full bg-primary/80" />
            <div className="absolute bottom-20 left-32 h-4 w-16 rounded-full bg-gold/80" />
            <div className="absolute bottom-12 right-16 h-16 w-72 rounded-[2rem] bg-[linear-gradient(100deg,#14C5CA,#DDF7F7_45%,#061F29_46%,#0B3844)] shadow-[0_20px_70px_rgba(0,0,0,0.28)]" />
            <div className="absolute bottom-10 right-24 size-12 rounded-full border-[8px] border-[#061A21] bg-[#0D6570]" />
            <div className="absolute bottom-10 right-56 size-12 rounded-full border-[8px] border-[#061A21] bg-[#0D6570]" />
            <div className="absolute bottom-28 right-24 h-28 w-[28rem] rounded-t-[14rem] bg-[linear-gradient(90deg,rgba(255,255,255,0.16),rgba(255,255,255,0.42),rgba(255,255,255,0.08))] opacity-80" />

            <div className="relative z-10 flex h-full min-h-[30rem] flex-col justify-between">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-gold/50 bg-primary-900/45 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-gold shadow-[0_12px_30px_rgba(0,0,0,0.14)] backdrop-blur">
                  <ShieldCheck className="size-4 text-gold" aria-hidden="true" /> Secure Portal
                </span>
                <h1 className="mt-8 max-w-xl font-heading text-5xl font-semibold leading-[0.98] text-white sm:text-6xl">
                  Welcome to <span className="text-primary">eDrive</span> Admin
                </h1>
                <div className="mt-7 h-1 w-20 rounded-full bg-gold" />
                <p className="mt-7 max-w-md text-base leading-8 text-white/82">
                  Manage bookings, fleet, staff, customers, and daily operations from one premium control center.
                </p>
              </div>

              <div className="w-fit rounded-[1.4rem] border border-white/15 bg-white/12 px-5 py-4 shadow-[0_18px_45px_rgba(0,0,0,0.18)] backdrop-blur">
                <div className="flex items-center gap-4">
                  <span className="flex size-12 items-center justify-center rounded-2xl border border-gold/50 text-gold"><ShieldCheck className="size-5" aria-hidden="true" /></span>
                  <div className="text-sm font-semibold leading-6 text-white/90"><p>Premium Experiences.</p><p>Seamless Operations.</p></div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center p-5 sm:p-8 lg:p-10">
            <div className="w-full max-w-[34rem] rounded-[2rem] border border-white/90 bg-white/88 p-5 shadow-[0_26px_70px_rgba(8,37,50,0.12),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-xl sm:p-8">
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

              <div className="my-6 flex items-center gap-4">
                <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/45 to-transparent" />
                <span className="text-gold">✦</span>
                <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/45 to-transparent" />
              </div>

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
