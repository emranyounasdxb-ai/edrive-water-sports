'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, KeyRound, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase-client';

type StatusState = {
  tone: 'success' | 'error' | 'info';
  text: string;
};

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<StatusState>({ tone: 'info', text: 'Checking password reset session...' });

  useEffect(() => {
    async function prepareSession() {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setStatus({ tone: 'error', text: error.message });
          setReady(false);
          return;
        }
        window.history.replaceState({}, document.title, '/admin/reset-password/');
      }

      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setStatus({ tone: 'error', text: 'Password reset session was not found. Please request a new reset email from the admin.' });
        setReady(false);
        return;
      }

      setStatus({ tone: 'info', text: 'Enter your new password below.' });
      setReady(true);
    }

    prepareSession();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < 8) {
      setStatus({ tone: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }

    if (password !== confirmPassword) {
      setStatus({ tone: 'error', text: 'Password confirmation does not match.' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setStatus({ tone: 'error', text: error.message });
      return;
    }

    setPassword('');
    setConfirmPassword('');
    setReady(false);
    setStatus({ tone: 'success', text: 'Password has been updated successfully. You can now sign in with the new password.' });
    await supabase.auth.signOut();
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-3xl gap-5">
        <Card className="overflow-hidden border-white/80 bg-white/90 shadow-[0_18px_45px_rgba(8,37,50,0.06)]">
          <CardHeader className="bg-primary-900 text-white">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-accent-300">
              <KeyRound className="size-3.5" aria-hidden="true" />
              Password Reset
            </span>
            <CardTitle className="mt-4 text-3xl text-white">Create a new password</CardTitle>
            <CardDescription className="mt-2 text-white/70">Use the reset link from your email, then set a secure password for your eDrive staff account.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 p-5">
            <div className={`rounded-2xl px-4 py-3 text-sm font-semibold ${status.tone === 'success' ? 'bg-green-50 text-green-700' : status.tone === 'error' ? 'bg-red-50 text-red-700' : 'bg-primary-50 text-primary-900'}`}>
              <span className="inline-flex items-center gap-2">
                {status.tone === 'success' ? <CheckCircle2 className="size-4" aria-hidden="true" /> : <LockKeyhole className="size-4" aria-hidden="true" />}
                {status.text}
              </span>
            </div>

            {ready ? (
              <form onSubmit={handleSubmit} className="grid gap-4">
                <label className="grid gap-1.5 text-sm font-semibold text-foreground">
                  New Password
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={8}
                    className="h-12 rounded-2xl border border-border bg-white px-4 text-sm font-semibold outline-none transition focus:border-primary"
                  />
                </label>
                <label className="grid gap-1.5 text-sm font-semibold text-foreground">
                  Confirm Password
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                    minLength={8}
                    className="h-12 rounded-2xl border border-border bg-white px-4 text-sm font-semibold outline-none transition focus:border-primary"
                  />
                </label>
                <Button type="submit" disabled={loading} className="h-12 rounded-2xl">{loading ? 'Updating...' : 'Update Password'}</Button>
              </form>
            ) : (
              <Button asChild className="w-fit rounded-2xl"><Link href="/admin/login">Go to Login</Link></Button>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
