'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { demoUsers, setDemoUser, type PortalRole } from '@/lib/demo-auth';
import { BrandMark } from '@/components/edrive/brand';

const loginCards: Array<{ role: PortalRole; title: string; description: string; access: string[] }> = [
  {
    role: 'admin',
    title: 'Admin Login',
    description: 'Full portal access for bookings, reports, payments, fleet, staff, customers, coupons, reviews, and settings.',
    access: ['New website bookings', 'Confirm or cancel bookings', 'Reports and payment summaries']
  },
  {
    role: 'manager',
    title: 'Manager Login',
    description: 'Operations access for confirmed bookings, ride updates, payment updates, vehicle assignment, and issue notes.',
    access: ['Confirmed bookings only', 'Captain / driver / vehicle updates', 'Payment and collection updates']
  }
];

export default function Page() {
  const router = useRouter();

  const handleLogin = (role: PortalRole) => {
    setDemoUser(role);
    router.push(role === 'manager' ? '/admin/manager' : '/admin');
  };

  return (
    <main className="min-h-screen bg-[#F4F7F8] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col justify-center gap-7">
        <div className="flex flex-col justify-between gap-5 rounded-[2rem] bg-white/75 p-5 shadow-[0_18px_50px_rgba(8,37,50,0.08)] sm:flex-row sm:items-center">
          <Link href="/" className="w-fit"><BrandMark /></Link>
          <Button asChild variant="outline" className="w-fit"><Link href="/">Back to website</Link></Button>
        </div>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-stretch">
          <Card className="overflow-hidden bg-primary-900 p-0 text-white">
            <CardContent className="relative flex h-full min-h-[420px] flex-col justify-between overflow-hidden p-7 sm:p-9">
              <div className="absolute -right-20 -top-24 size-64 rounded-full bg-primary/30 blur-3xl" />
              <div className="absolute -bottom-24 -left-20 size-72 rounded-full bg-gold/30 blur-3xl" />
              <div className="relative">
                <span className="soft-label border-white/15 bg-white/10 text-white">Secure Portal</span>
                <h1 className="mt-6 max-w-lg font-heading text-4xl font-semibold leading-tight text-white sm:text-5xl">Choose who is signing in</h1>
                <p className="mt-5 max-w-xl text-sm leading-7 text-white/72 sm:text-base">This is a temporary role-based login for testing. Later it can be replaced with Supabase Auth using the same role flow.</p>
              </div>
              <div className="relative grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/55">Admin</p>
                  <p className="mt-2 font-semibold text-white">{demoUsers.admin.email}</p>
                </div>
                <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.18em] text-white/55">Manager</p>
                  <p className="mt-2 font-semibold text-white">{demoUsers.manager.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-5">
            {loginCards.map((item) => (
              <Card key={item.role} className="premium-card-hover">
                <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <span className="flex size-11 items-center justify-center rounded-2xl bg-primary-100 text-primary"><LockKeyhole className="size-5" aria-hidden="true" /></span>
                      <div>
                        <CardTitle>{item.title}</CardTitle>
                        <CardDescription>{demoUsers[item.role].email}</CardDescription>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-muted-foreground">{item.description}</p>
                  </div>
                  <Button type="button" onClick={() => handleLogin(item.role)} className="shrink-0">Login as {demoUsers[item.role].roleLabel}</Button>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-3">
                  {item.access.map((access) => (
                    <div key={access} className="flex items-start gap-2 rounded-2xl bg-primary-50 px-3 py-3 text-xs font-semibold text-primary-900">
                      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                      <span>{access}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
