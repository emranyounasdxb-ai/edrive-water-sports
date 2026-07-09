'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowUpRight, BadgeDollarSign, CalendarPlus, Headphones, LayoutDashboard, LogOut, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BrandMark } from '@/components/edrive/brand';
import { supabase } from '@/lib/supabase-client';

type AgentProfile = {
  company_name: string;
  contact_person: string;
  login_email: string | null;
  email: string | null;
  phone: string | null;
  agent_type: string | null;
  status: string;
};

const quickCards = [
  { title: 'New Booking', description: 'Create a request for your customer with B2B package price.', icon: CalendarPlus, href: '/agent/new-booking', action: 'Create Booking' },
  { title: 'My Bookings', description: 'Track your submitted booking requests and payment status.', icon: LayoutDashboard, href: '/agent/bookings', action: 'View Bookings' },
  { title: 'Invoices', description: 'View payable, paid and pending balances.', icon: BadgeDollarSign, href: '', action: 'Coming Soon' },
  { title: 'Support', description: 'Contact eDrive operations team.', icon: Headphones, href: '', action: 'Coming Soon' }
];

function isActiveStatus(value: string | null | undefined) {
  return String(value || '').trim().toLowerCase() === 'active';
}

export default function AgentPortalPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadAgent() {
      setLoading(true);
      setError('');

      const { data: sessionData } = await supabase.auth.getSession();
      const authUser = sessionData.session?.user;

      if (!authUser) {
        router.replace('/admin/login');
        return;
      }

      const { data, error: profileError } = await supabase
        .from('b2b_agents')
        .select('company_name,contact_person,login_email,email,phone,agent_type,status')
        .eq('auth_user_id', authUser.id)
        .maybeSingle();

      if (!active) return;

      const nextProfile = data as AgentProfile | null;

      if (profileError) {
        setError(`B2B profile read error: ${profileError.message}`);
        setLoading(false);
        return;
      }

      if (!nextProfile || !isActiveStatus(nextProfile.status)) {
        setError('Active B2B agent profile nahi mila. Please login screen se B2B Agent select karein ya admin se contact karein.');
        setLoading(false);
        return;
      }

      setProfile(nextProfile);
      setLoading(false);
    }

    loadAgent();
    return () => {
      active = false;
    };
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/admin/login');
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#F4F7F8] text-sm font-semibold text-muted-foreground">Loading B2B portal...</div>;
  }

  if (error || !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F4F7F8] px-4">
        <div className="w-full max-w-lg rounded-[2rem] border border-border bg-white p-6 text-center shadow-[0_24px_70px_rgba(8,37,50,0.12)]">
          <BrandMark className="mx-auto mb-5 w-fit" />
          <h1 className="font-heading text-2xl font-semibold text-primary-900">B2B access needs attention</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{error || 'B2B profile could not be loaded.'}</p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild variant="outline" className="rounded-full"><Link href="/admin/login">Back to login</Link></Button>
            <Button type="button" className="rounded-full" onClick={handleLogout}>Sign out</Button>
          </div>
        </div>
      </main>
    );
  }

  const companyName = profile.company_name || 'B2B Partner';
  const contactName = profile.contact_person || companyName;
  const profileEmail = profile.login_email || profile.email || '-';

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#F5F8F8_0%,#EEF7F7_52%,#F8F2E8_100%)] px-4 py-5 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-[1.7rem] border border-white/85 bg-white/82 px-5 py-4 shadow-[0_18px_55px_rgba(8,37,50,0.08)] backdrop-blur-xl sm:px-7">
          <Link href="/" className="w-fit"><BrandMark /></Link>
          <div className="flex items-center gap-3">
            <Button asChild variant="outline" className="rounded-full bg-white/90"><Link href="/">View Website</Link></Button>
            <Button type="button" onClick={handleLogout} className="rounded-full bg-primary-900 hover:bg-primary-800"><LogOut className="size-4" aria-hidden="true" />Logout</Button>
          </div>
        </header>

        <section className="mt-6 overflow-hidden rounded-[2rem] border border-white/85 bg-white/78 shadow-[0_26px_80px_rgba(8,37,50,0.11)] backdrop-blur-xl">
          <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="p-6 sm:p-9 lg:p-12">
              <span className="inline-flex rounded-full border border-primary/20 bg-primary-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.2em] text-primary">B2B Agent Portal</span>
              <h1 className="mt-6 max-w-xl font-heading text-4xl font-semibold leading-tight tracking-[-0.04em] text-primary-900 sm:text-5xl">Welcome, {contactName}</h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">{companyName} ke liye limited partner dashboard. Yahan se bookings, invoices, reports aur payment workflows manage honge.</p>

              <div className="mt-7 grid gap-3 rounded-[1.5rem] border border-border bg-white/82 p-4 shadow-sm sm:grid-cols-2">
                <div className="rounded-2xl bg-[#F4F7F8] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Company</p>
                  <p className="mt-2 font-heading text-xl font-semibold text-primary-900">{companyName}</p>
                </div>
                <div className="rounded-2xl bg-[#F4F7F8] p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Email</p>
                  <p className="mt-2 text-sm font-semibold text-primary-900">{profileEmail}</p>
                </div>
              </div>
            </div>

            <div className="relative min-h-[24rem] overflow-hidden bg-primary-900 p-6 text-white sm:p-9">
              <img src="/images/admin/login-hero.webp" alt="B2B partner portal" className="absolute inset-0 h-full w-full object-cover opacity-55" />
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(4,32,40,0.92),rgba(14,124,134,0.46))]" />
              <div className="relative z-10 flex h-full flex-col justify-end">
                <p className="max-w-md font-heading text-3xl font-semibold leading-tight">Partner bookings, customer requests and payment tracking in one clean portal.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickCards.map(({ title, description, icon: Icon, href, action }) => (
            <div key={title} className="rounded-[1.5rem] border border-white/85 bg-white/84 p-5 shadow-[0_18px_45px_rgba(8,37,50,0.08)] backdrop-blur-xl">
              <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-primary-50 text-primary"><Icon className="size-5" aria-hidden="true" /></div>
              <h2 className="font-heading text-xl font-semibold text-primary-900">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              {href ? (
                <Button asChild variant="outline" className="mt-5 rounded-full bg-white/90"><Link href={href}>{action} <ArrowUpRight className="size-4" aria-hidden="true" /></Link></Button>
              ) : (
                <Button variant="outline" className="mt-5 rounded-full bg-white/90" disabled>{action} <ArrowUpRight className="size-4" aria-hidden="true" /></Button>
              )}
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
