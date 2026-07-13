'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, KeyRound, MailCheck, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { recordAuditLog } from '@/lib/audit-log';
import { supabase } from '@/lib/supabase-client';

export default function StaffPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function checkAccess() {
      const searchEmail = new URLSearchParams(window.location.search).get('email');
      if (searchEmail) setEmail(searchEmail.trim().toLowerCase());

      const { data: userData } = await supabase.auth.getUser();
      const authUser = userData.user;
      if (!authUser) {
        setChecking(false);
        return;
      }

      const authEmail = authUser.email || '';
      const filter = authEmail ? `auth_user_id.eq.${authUser.id},email.eq.${authEmail}` : `auth_user_id.eq.${authUser.id}`;
      const { data } = await supabase.from('admin_users').select('role,status').or(filter).limit(1);
      const profile = (data?.[0] || null) as { role?: string | null; status?: string | null } | null;
      setAllowed(profile?.role === 'super_admin' && profile?.status === 'active');
      setChecking(false);
    }

    void checkAccess();
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    const cleanEmail = email.trim().toLowerCase();
    const redirectTo = `${window.location.origin}/admin/reset-password/`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(cleanEmail, { redirectTo });
    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }
    await recordAuditLog({ module: 'team', action: 'password_reset_sent', entityType: 'admin_user', entityLabel: cleanEmail, summary: `Password reset email was sent to ${cleanEmail}.`, metadata: { email: cleanEmail } });
    setMessage(`Password reset email sent to ${cleanEmail}.`);
    setLoading(false);
  }

  if (checking) return <div className="p-6 text-sm font-semibold text-muted-foreground">Checking access...</div>;
  if (!allowed) return <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-6"><h1 className="font-heading text-2xl font-semibold text-red-800">Super Admin access required</h1><p className="mt-2 text-sm text-red-700">Only an active Super Admin can send staff password reset emails.</p></div>;

  return (
    <section className="mx-auto w-full max-w-4xl py-4 sm:py-6">
      <Link href="/admin/staff-management" className="inline-flex items-center gap-2 text-sm font-bold text-primary"><ArrowLeft className="size-4" aria-hidden="true" />Back to Team & Access</Link>
      <Card className="mt-4 overflow-hidden rounded-[1.5rem] border-white/80 bg-white/90 shadow-[0_18px_45px_rgba(8,37,50,0.06)]">
        <CardHeader className="bg-primary-900 text-white">
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-accent-300"><KeyRound className="size-3.5" aria-hidden="true" />Password Access</span>
          <CardTitle className="mt-3 text-3xl text-white">Send staff password reset email</CardTitle>
          <CardDescription className="max-w-2xl text-white/70">The team member receives a secure Supabase email and chooses a new password. No privileged key or password is stored in the website.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 p-5 lg:grid-cols-[1fr_0.8fr]">
          <form onSubmit={submit} className="grid content-start gap-4">
            <label className="grid gap-1.5 text-sm font-semibold">Staff Email<Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="staff@edrivedubai.ae" className="h-12 rounded-2xl" /></label>
            {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
            {message ? <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{message}</p> : null}
            <Button type="submit" disabled={loading} className="h-12 rounded-2xl"><MailCheck className="size-4" aria-hidden="true" />{loading ? 'Sending...' : 'Send Password Reset Email'}</Button>
          </form>
          <div className="rounded-[1.25rem] border border-primary/15 bg-primary-50 p-5">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-white text-primary"><ShieldCheck className="size-5" aria-hidden="true" /></span>
            <h2 className="mt-3 font-heading text-lg font-semibold text-primary-900">Secure static flow</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">The reset email is handled directly by Supabase Auth. The website never reads or sets the staff member's password.</p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
