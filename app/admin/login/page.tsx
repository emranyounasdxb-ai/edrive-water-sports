'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BrandMark } from '@/components/edrive/brand';
import { supabase } from '@/lib/supabase-client';

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
      setError(loginError.message);
      return;
    }
    router.push('/admin');
    router.refresh();
  }

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
                <h1 className="mt-6 max-w-lg font-heading text-4xl font-semibold leading-tight text-white sm:text-5xl">Sign in to eDrive admin</h1>
                <p className="mt-5 max-w-xl text-sm leading-7 text-white/72 sm:text-base">Use your Supabase admin account to manage staff, packages, vehicles, bookings, customers, and payments.</p>
              </div>
              <div className="relative rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-[0.18em] text-white/55">Super Admin</p>
                <p className="mt-2 font-semibold text-white">admin@edrive.ae</p>
              </div>
            </CardContent>
          </Card>

          <Card className="premium-card-hover self-center">
            <CardHeader>
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-primary-100 text-primary"><LockKeyhole className="size-5" aria-hidden="true" /></span>
                <div>
                  <CardTitle>Admin Login</CardTitle>
                  <CardDescription>Supabase secure authentication</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid gap-4">
                <label className="grid gap-1.5 text-sm font-semibold text-foreground">Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="h-11 rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary" /></label>
                <label className="grid gap-1.5 text-sm font-semibold text-foreground">Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required className="h-11 rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary" /></label>
                {error ? <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p> : null}
                <Button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</Button>
              </form>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {['Role-based portal access', 'Database-backed admin records'].map((item) => <div key={item} className="flex items-start gap-2 rounded-2xl bg-primary-50 px-3 py-3 text-xs font-semibold text-primary-900"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" /><span>{item}</span></div>)}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
