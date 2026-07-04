'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { ArrowRightToLine, BriefcaseBusiness, Building2, CalendarCheck, Eye, Globe2, LayoutDashboard, LockKeyhole, Mail, ShieldCheck, Ship, UserRound, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandMark } from '@/components/edrive/brand';
import { supabase } from '@/lib/supabase-client';
import { cn } from '@/lib/utils';

type LoginType = 'staff' | 'agent';

const trustItems = {
  staff: [
    { label: 'Secure staff access', icon: ShieldCheck },
    { label: 'Role-based portal', icon: UserRound },
    { label: 'Operations dashboard', icon: LayoutDashboard }
  ],
  agent: [
    { label: 'Partner access', icon: Building2 },
    { label: 'Booking requests', icon: CalendarCheck },
    { label: 'Commission view', icon: BriefcaseBusiness }
  ]
};

const heroItems = [
  { label: 'Bookings', icon: CalendarCheck },
  { label: 'Fleet', icon: Ship },
  { label: 'Marine ops', icon: Waves }
];

const loginOptions = [
  {
    id: 'staff' as const,
    title: 'eDrive Staff',
    description: 'Internal admin, bookings, fleet and operations team.',
    icon: ShieldCheck
  },
  {
    id: 'agent' as const,
    title: 'B2B Agent',
    description: 'Hotels, travel agents, vendors and tour partners.',
    icon: Building2
  }
];

export default function Page() {
  const router = useRouter();
  const [loginType, setLoginType] = useState<LoginType>('staff');
  const [email, setEmail] = useState('admin@edrive.ae');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });

    if (loginError || !loginData.user) {
      setLoading(false);
      setError('Email ya password sahi nahi hai. Please dobara check karein.');
      return;
    }

    const authEmail = loginData.user.email || email;
    const queryFilter = authEmail ? `auth_user_id.eq.${loginData.user.id},email.eq.${authEmail}` : `auth_user_id.eq.${loginData.user.id}`;

    if (loginType === 'staff') {
      const { data: profiles, error: profileError } = await supabase
        .from('admin_users')
        .select('id,status')
        .or(queryFilter)
        .limit(1);

      const profile = profiles?.[0] ?? null;
      if (profileError || !profile || profile.status !== 'active') {
        await supabase.auth.signOut();
        setLoading(false);
        setError('Ye account active eDrive staff profile se linked nahi hai. Please B2B Agent select karein ya admin se contact karein.');
        return;
      }

      setLoading(false);
      router.push('/admin');
      router.refresh();
      return;
    }

    const { data: agents, error: agentError } = await supabase
      .from('b2b_agent_users')
      .select('id,status,agent_id')
      .or(queryFilter)
      .limit(1);

    const agent = agents?.[0] ?? null;
    if (agentError || !agent || agent.status !== 'active') {
      await supabase.auth.signOut();
      setLoading(false);
      setError('Ye account active B2B agent profile se linked nahi hai. Please eDrive Staff select karein ya admin se contact karein.');
      return;
    }

    setLoading(false);
    router.push('/agent');
    router.refresh();
  }

  const activeTrustItems = trustItems[loginType];

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_14%_12%,rgba(14,124,134,0.12),transparent_28%),radial-gradient(circle_at_88%_8%,rgba(200,151,74,0.16),transparent_25%),linear-gradient(135deg,#F5F8F8_0%,#EEF7F7_48%,#F8F2E8_100%)] px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col gap-5">
        <header className="flex items-center justify-between rounded-[1.8rem] border border-white/85 bg-white/76 px-5 py-4 shadow-[0_18px_55px_rgba(8,37,50,0.08)] backdrop-blur-xl sm:px-8">
          <Link href="/" className="w-fit"><BrandMark /></Link>
          <Button asChild variant="outline" className="rounded-full border-gold/55 bg-white/85 px-5 text-primary-900 shadow-sm hover:border-gold hover:bg-white">
            <Link href="/"><Globe2 className="size-4" aria-hidden="true" />Back to website</Link>
          </Button>
        </header>

        <section className="grid flex-1 overflow-hidden rounded-[2rem] border border-white/85 bg-white/72 shadow-[0_28px_90px_rgba(8,37,50,0.13)] backdrop-blur-xl lg:grid-cols-[0.88fr_1.08fr]">
          <div className="relative flex items-center justify-center overflow-hidden p-5 sm:p-8 lg:p-10">
            <div className="absolute left-8 top-10 size-64 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute bottom-10 right-12 size-72 rounded-full bg-gold/16 blur-3xl" />
            <div className="relative w-full max-w-[34rem] rounded-[2rem] border border-white/90 bg-white/92 p-5 shadow-[0_26px_70px_rgba(8,37,50,0.12),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-xl sm:p-8">
              <div className="mb-6 flex items-center gap-4">
                <span className="flex size-16 items-center justify-center rounded-full border border-gold/30 bg-[linear-gradient(135deg,#15BEC4,#0E7C86)] text-white shadow-[0_18px_35px_rgba(14,124,134,0.25)]"><LockKeyhole className="size-7" aria-hidden="true" /></span>
                <div>
                  <h2 className="font-heading text-3xl font-semibold text-primary-900 sm:text-4xl">{loginType === 'staff' ? 'Admin Login' : 'B2B Agent Login'}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{loginType === 'staff' ? 'Use your authorized staff account to continue.' : 'Access your partner bookings and commission portal.'}</p>
                </div>
              </div>

              <div className="mb-5 grid gap-3 sm:grid-cols-2">
                {loginOptions.map(({ id, title, description, icon: Icon }) => {
                  const selected = loginType === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setLoginType(id)}
                      className={cn(
                        'rounded-2xl border bg-white/82 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-[0_14px_30px_rgba(8,37,50,0.08)]',
                        selected && 'border-primary bg-primary-50 shadow-[0_14px_30px_rgba(14,124,134,0.12)]'
                      )}
                    >
                      <span className="mb-3 flex items-center gap-2 text-sm font-extrabold text-primary-900"><Icon className="size-4 text-primary" aria-hidden="true" />{title}</span>
                      <span className="block text-xs font-semibold leading-5 text-muted-foreground">{description}</span>
                    </button>
                  );
                })}
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
                  <ArrowRightToLine className="size-5 text-gold" aria-hidden="true" />{loading ? 'Signing in...' : loginType === 'staff' ? 'Sign in as Staff' : 'Sign in as B2B Agent'}
                </Button>
              </form>

              <div className="my-6 flex items-center gap-4"><span className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/45 to-transparent" /><span className="text-gold">✦</span><span className="h-px flex-1 bg-gradient-to-r from-transparent via-gold/45 to-transparent" /></div>

              <div className="grid gap-3 sm:grid-cols-3">
                {activeTrustItems.map(({ label, icon: Icon }) => (
                  <div key={label} className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-white/80 px-3 py-3 text-center text-xs font-bold text-primary-900 shadow-sm">
                    <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative min-h-[34rem] overflow-hidden rounded-[2rem] bg-[#F7F0E4] p-6 text-primary-900 sm:p-9 lg:m-3 lg:min-h-0">
            <img src="/images/admin/login-hero.webp" alt="eDrive Water Sports admin portal" className="absolute inset-0 h-full w-full object-cover object-center" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.80)_0%,rgba(255,255,255,0.56)_34%,rgba(255,255,255,0.16)_64%,rgba(255,255,255,0.02)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_26%_18%,rgba(255,255,255,0.46),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.05)_52%,rgba(8,80,88,0.18)_100%)]" />
            <div className="absolute inset-x-0 bottom-0 h-[26%] bg-[linear-gradient(180deg,transparent,rgba(245,239,228,0.42))]" />
            <div className="absolute -right-28 top-10 size-[34rem] rounded-full border border-white/40" />
            <div className="absolute right-8 top-20 size-[27rem] rounded-full border border-gold/20" />

            <div className="relative z-10 flex h-full min-h-[30rem] flex-col justify-between">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-gold/45 bg-white/52 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#9A6B25] shadow-[0_12px_30px_rgba(8,37,50,0.12)] backdrop-blur-md">
                  <ShieldCheck className="size-4 text-[#9A6B25]" aria-hidden="true" /> Secure Portal
                </span>
                <h1 className="mt-7 max-w-[28rem] font-heading text-[3.2rem] font-semibold leading-[0.96] tracking-[-0.04em] text-[#8B6426] drop-shadow-[0_1px_0_rgba(255,255,255,0.75)] sm:text-[4.2rem] xl:text-[4.85rem]">
                  <span className="block">Welcome to</span>
                  <span className="block text-primary-900">eDrive</span>
                </h1>
                <div className="mt-5 h-1 w-20 rounded-full bg-[#B98A42] shadow-[0_8px_20px_rgba(185,138,66,0.26)]" />
                <p className="ml-1 mt-3 max-w-[21rem] rounded-xl border border-white/24 bg-white/16 px-3.5 py-2.5 text-xs font-semibold leading-5 text-primary-900/90 shadow-[0_10px_24px_rgba(8,37,50,0.07)] backdrop-blur-sm sm:text-sm sm:leading-6">
                  {loginType === 'staff' ? 'Manage bookings, fleet, staff, customers, and daily operations from one premium control center.' : 'Manage referred bookings, partner requests, commission tracking, and customer follow-ups from one secure portal.'}
                </p>
              </div>

              <div className="flex max-w-[35rem] flex-wrap gap-3">
                {heroItems.map(({ label, icon: Icon }) => (
                  <div key={label} className="flex min-w-[8.25rem] items-center gap-2 rounded-full border border-white/45 bg-white/38 px-4 py-2.5 shadow-[0_12px_28px_rgba(8,37,50,0.12)] backdrop-blur-md">
                    <Icon className="size-4 text-[#9A6B25]" aria-hidden="true" />
                    <p className="text-xs font-bold text-primary-900">{label}</p>
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
