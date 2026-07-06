'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowLeft, KeyRound, MailCheck, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase-client';

type ActionMode = 'send-reset' | 'set-password';

type StatusState = {
  tone: 'success' | 'error' | 'info';
  text: string;
};

function makeTemporaryPassword() {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `eDrive@${new Date().getFullYear()}-${suffix}`;
}

export default function StaffPasswordPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<ActionMode>('send-reset');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [status, setStatus] = useState<StatusState | null>(null);

  const redirectTo = useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    return `${window.location.origin}/admin/reset-password/`;
  }, []);

  useEffect(() => {
    async function checkAccess() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setChecking(false);
        setAllowed(false);
        return;
      }

      const { data: profile } = await supabase
        .from('admin_users')
        .select('role, status')
        .eq('auth_user_id', userData.user.id)
        .maybeSingle();

      setAllowed(Boolean(profile && profile.status === 'active' && ['super_admin', 'admin', 'manager'].includes(String(profile.role))));
      setChecking(false);
    }

    checkAccess();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus(null);

    const body = {
      email: email.trim().toLowerCase(),
      mode,
      password: mode === 'set-password' ? password : undefined,
      redirectTo
    };

    const { data, error } = await supabase.functions.invoke('staff-password', { body });
    setLoading(false);

    if (error) {
      setStatus({ tone: 'error', text: error.message || 'Unable to complete password action.' });
      return;
    }

    const message = typeof data?.message === 'string' ? data.message : 'Password action completed successfully.';
    setStatus({ tone: 'success', text: message });
  }

  if (checking) {
    return (
      <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Card><CardContent className="p-8 text-sm font-semibold text-muted-foreground">Checking admin access...</CardContent></Card>
        </div>
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>Admin access required</CardTitle>
              <CardDescription>Please sign in with an active eDrive admin account before managing staff passwords.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild><Link href="/admin/login">Go to Login</Link></Button>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl gap-5">
        <Link href="/admin/staff" className="inline-flex w-fit items-center gap-2 text-sm font-bold text-primary transition hover:text-primary-700">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Staff
        </Link>

        <Card className="overflow-hidden border-white/80 bg-white/90 shadow-[0_18px_45px_rgba(8,37,50,0.06)]">
          <CardHeader className="bg-primary-900 text-white">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-accent-300">
                  <KeyRound className="size-3.5" aria-hidden="true" />
                  Staff Passwords
                </span>
                <CardTitle className="mt-4 text-3xl text-white">Reset or create staff login password</CardTitle>
                <CardDescription className="mt-2 max-w-2xl text-white/70">
                  Use the staff email saved in Staff records. The system will link the Staff record with Supabase Auth if it is not linked yet.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 p-5 lg:grid-cols-[1fr_0.8fr]">
            <form onSubmit={handleSubmit} className="grid gap-4">
              <label className="grid gap-1.5 text-sm font-semibold text-foreground">
                Staff Email
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  placeholder="staff@edrivedubai.ae"
                  className="h-12 rounded-2xl border border-border bg-white px-4 text-sm font-semibold outline-none transition focus:border-primary"
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setMode('send-reset')}
                  className={`rounded-2xl border p-4 text-left transition ${mode === 'send-reset' ? 'border-primary bg-primary-50 text-primary-900' : 'border-border bg-white text-muted-foreground hover:border-primary/40'}`}
                >
                  <MailCheck className="size-5 text-primary" aria-hidden="true" />
                  <span className="mt-3 block text-sm font-bold">Send reset email</span>
                  <span className="mt-1 block text-xs leading-5">Staff receives an email and sets their own password.</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('set-password');
                    setPassword((current) => current || makeTemporaryPassword());
                  }}
                  className={`rounded-2xl border p-4 text-left transition ${mode === 'set-password' ? 'border-primary bg-primary-50 text-primary-900' : 'border-border bg-white text-muted-foreground hover:border-primary/40'}`}
                >
                  <KeyRound className="size-5 text-primary" aria-hidden="true" />
                  <span className="mt-3 block text-sm font-bold">Set temporary password</span>
                  <span className="mt-1 block text-xs leading-5">Admin sets a temporary password for immediate login.</span>
                </button>
              </div>

              {mode === 'set-password' ? (
                <label className="grid gap-1.5 text-sm font-semibold text-foreground">
                  Temporary Password
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      minLength={8}
                      className="h-12 min-w-0 flex-1 rounded-2xl border border-border bg-white px-4 text-sm font-semibold outline-none transition focus:border-primary"
                    />
                    <Button type="button" variant="outline" onClick={() => setPassword(makeTemporaryPassword())}>Generate</Button>
                  </div>
                </label>
              ) : null}

              {status ? (
                <div className={`rounded-2xl px-4 py-3 text-sm font-semibold ${status.tone === 'success' ? 'bg-green-50 text-green-700' : status.tone === 'error' ? 'bg-red-50 text-red-700' : 'bg-primary-50 text-primary-900'}`}>
                  {status.text}
                </div>
              ) : null}

              <Button type="submit" disabled={loading} className="h-12 rounded-2xl">
                {loading ? 'Processing...' : mode === 'send-reset' ? 'Send Password Reset Email' : 'Set Temporary Password'}
              </Button>
            </form>

            <div className="grid content-start gap-3 rounded-[1.5rem] border border-border bg-primary-50 p-5">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white text-primary"><ShieldCheck className="size-5" aria-hidden="true" /></span>
                <div>
                  <p className="text-sm font-bold text-primary-900">Best practice</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">Send reset email when possible. Use temporary password only when staff needs immediate access and then ask them to change it.</p>
                </div>
              </div>
              <div className="rounded-2xl bg-white p-4 text-xs leading-5 text-muted-foreground">
                Reset emails require Supabase Auth email templates and redirect URL configuration. Temporary password works through the secure Edge Function with service role access.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
