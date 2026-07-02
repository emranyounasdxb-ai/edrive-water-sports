'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Anchor, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { loginStaff } from '@/features/auth/services/auth.service';

export function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await loginStaff(email, password);
      router.push('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-ocean-radial px-4">
      <form onSubmit={submit} className="glass-panel w-full max-w-md rounded-3xl p-7">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-primary ring-1 ring-white/15">
          <Anchor className="h-6 w-6" />
        </div>
        <h1 className="mt-6 text-3xl font-semibold text-white">Staff Login</h1>
        <p className="mt-2 text-sm text-white/62">Authorized eDrive Water Sports staff only.</p>
        {error ? <div className="mt-5 rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</div> : null}
        <div className="mt-6 space-y-4">
          <input className="input-shell h-12 w-full rounded-2xl px-4" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="input-shell h-12 w-full rounded-2xl px-4" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button className="w-full" size="lg" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Sign In
          </Button>
        </div>
      </form>
    </main>
  );
}
