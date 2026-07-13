'use client';

import { useEffect, useState } from 'react';
import { AdminPaymentsControlCenter } from './admin-payments-control-center';
import { ManagerCollectionsPage, type ManagerIdentity } from './manager-collections-page';
import { supabase } from '@/lib/supabase-client';

type AdminProfile = {
  full_name: string | null;
  email: string | null;
  role: string | null;
  status: string | null;
};

export function PaymentsRoutePage() {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('admin');
  const [manager, setManager] = useState<ManagerIdentity>({ name: '', email: '' });

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      const { data: sessionData } = await supabase.auth.getSession();
      const authUser = sessionData.session?.user;
      const authEmail = authUser?.email || '';
      if (!authUser) {
        if (active) setLoading(false);
        return;
      }

      const filter = authEmail ? `auth_user_id.eq.${authUser.id},email.eq.${authEmail}` : `auth_user_id.eq.${authUser.id}`;
      const { data } = await supabase.from('admin_users').select('full_name,email,role,status').or(filter).limit(1);
      const profile = (data || [])[0] as AdminProfile | undefined;
      if (!active) return;

      setRole(profile?.role || 'admin');
      setManager({ name: profile?.full_name || authEmail, email: profile?.email || authEmail });
      setLoading(false);
    }

    void loadProfile();
    return () => { active = false; };
  }, []);

  if (loading) return <div className="p-6 text-sm font-semibold text-muted-foreground">Loading payments...</div>;
  if (role === 'manager') return <ManagerCollectionsPage manager={manager} />;
  return <AdminPaymentsControlCenter />;
}
