import { supabase } from '@/lib/supabase-client';

export type InternalPortalUserInput = {
  full_name: string;
  email: string;
  initial_password: string;
  role: 'super_admin' | 'admin' | 'booking_staff' | 'manager' | 'finance';
  department: string;
  status: 'active' | 'inactive' | 'suspended';
  nationality: string;
  phone?: string;
  avatar_url?: string;
  notes?: string;
};

export type B2BAgentUserInput = {
  email: string;
  initial_password: string;
  profile: Record<string, unknown>;
};

export type ProvisionedPortalUser = {
  auth_user_id: string;
  profile_id: string;
  account_type: 'internal_user' | 'b2b_agent';
};

async function invokeProvisioning(body: Record<string, unknown>) {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !sessionData.session) throw new Error(sessionError?.message || 'An active Super Admin session is required.');

  const { data, error } = await supabase.functions.invoke('provision-portal-user', { body });
  if (error) {
    const context = (error as { context?: Response }).context;
    let message = error.message;
    if (context) {
      try {
        const payload = await context.clone().json() as { error?: string };
        if (payload.error) message = payload.error;
      } catch {
        // Keep the safe Supabase Functions error.
      }
    }
    throw new Error(message);
  }
  return data as ProvisionedPortalUser;
}

export function provisionInternalPortalUser(input: InternalPortalUserInput) {
  return invokeProvisioning({ account_type: 'internal_user', ...input, email: input.email.trim().toLowerCase() });
}

export function provisionB2BAgentUser(input: B2BAgentUserInput) {
  return invokeProvisioning({ account_type: 'b2b_agent', ...input, email: input.email.trim().toLowerCase() });
}
