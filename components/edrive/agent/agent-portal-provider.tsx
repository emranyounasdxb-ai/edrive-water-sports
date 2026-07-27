'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CircleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase-client';
import { getB2BFinanceSummary, type B2BFinanceSummary } from '@/services/b2b-finance';

export type AgentPortalProfile = {
  id: string;
  agent_code: string | null;
  company_name: string;
  contact_person?: string | null;
  login_email?: string | null;
  email?: string | null;
  phone?: string | null;
  status: string;
};

type AgentPortalContextValue = {
  profile: AgentPortalProfile;
  agentId: string;
  walletBalance: number;
  financeSummary: B2BFinanceSummary;
  refreshingPortal: boolean;
  accessError: string;
  refreshPortal: () => Promise<B2BFinanceSummary | null>;
};

const AgentPortalContext = createContext<AgentPortalContextValue | null>(null);

export function AgentPortalProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [profile, setProfile] = useState<AgentPortalProfile | null>(null);
  const [financeSummary, setFinanceSummary] = useState<B2BFinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshingPortal, setRefreshingPortal] = useState(false);
  const [accessError, setAccessError] = useState('');

  const loadPortal = useCallback(async (refresh = false) => {
    let identityValidated = false;
    refresh ? setRefreshingPortal(true) : setLoading(true);
    setAccessError('');
    try {
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw new Error(sessionError.message);
      if (!session.session?.user) {
        router.replace('/admin/login');
        return null;
      }
      const profileResult = await supabase
        .from('b2b_agents')
        .select('id,agent_code,company_name,contact_person,login_email,email,phone,status')
        .eq('auth_user_id', session.session.user.id)
        .maybeSingle();
      if (profileResult.error) throw new Error(profileResult.error.message);
      const nextProfile = profileResult.data as AgentPortalProfile | null;
      if (!nextProfile) throw new Error('Your B2B Agent profile could not be found.');
      if (String(nextProfile.status).toLowerCase() !== 'active') throw new Error('An active B2B Agent profile is required to access this portal.');
      identityValidated = true;
      const nextSummary = await getB2BFinanceSummary();
      setProfile(nextProfile);
      setFinanceSummary(nextSummary);
      return nextSummary;
    } catch (error) {
      if (!refresh || !identityValidated) {
        setProfile(null);
        setFinanceSummary(null);
      }
      setAccessError(error instanceof Error ? error.message : 'Your B2B Agent profile could not be loaded.');
      return null;
    } finally {
      setLoading(false);
      setRefreshingPortal(false);
    }
  }, [router]);

  useEffect(() => { void loadPortal(); }, [loadPortal]);

  const value = useMemo<AgentPortalContextValue | null>(() => profile && financeSummary ? ({
    profile,
    agentId: profile.id,
    walletBalance: financeSummary.wallet_balance_aed,
    financeSummary,
    refreshingPortal,
    accessError,
    refreshPortal: () => loadPortal(true)
  }) : null, [profile, financeSummary, refreshingPortal, accessError, loadPortal]);

  if (loading) return <InitialPortalLoading />;
  if (!value) return <PortalAccessError message={accessError} />;
  return <AgentPortalContext.Provider value={value}>{children}</AgentPortalContext.Provider>;
}

export function useAgentPortal() {
  const context = useContext(AgentPortalContext);
  if (!context) throw new Error('useAgentPortal must be used inside AgentPortalProvider.');
  return context;
}

function InitialPortalLoading() {
  return <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[240px_1fr]"><aside className="hidden border-r border-slate-200 bg-white p-4 lg:block"><div className="h-12 animate-pulse rounded-xl bg-slate-100" /><div className="mt-4 h-32 animate-pulse rounded-xl bg-slate-100" /></aside><main className="p-4 lg:p-6"><div className="h-20 max-w-3xl animate-pulse rounded-xl bg-slate-200" /><div className="mt-4 grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-24 animate-pulse rounded-xl bg-white shadow-sm" />)}</div></main></div>;
}

function PortalAccessError({ message }: { message: string }) {
  return <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4"><div className="max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-xl"><CircleAlert className="mx-auto size-8 text-red-600" /><h1 className="mt-4 font-heading text-xl font-semibold">Portal access unavailable</h1><p className="mt-2 text-sm text-slate-600">{message || 'Your B2B Agent profile could not be loaded.'}</p><Button asChild className="mt-5"><Link href="/admin/login">Return to login</Link></Button></div></main>;
}
