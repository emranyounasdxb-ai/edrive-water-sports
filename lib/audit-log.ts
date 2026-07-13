import { supabase } from '@/lib/supabase-client';

export type AuditLogInput = {
  module: string;
  action: string;
  summary: string;
  entityType?: string;
  entityId?: string | null;
  entityLabel?: string | null;
  metadata?: Record<string, unknown>;
};

type AdminProfile = {
  full_name: string | null;
  email: string | null;
  role: string | null;
};

export async function recordAuditLog(input: AuditLogInput) {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const authUser = sessionData.session?.user;
    if (!authUser) return { ok: false, error: 'No authenticated user.' };

    const authEmail = authUser.email || '';
    const filter = authEmail
      ? `auth_user_id.eq.${authUser.id},email.eq.${authEmail}`
      : `auth_user_id.eq.${authUser.id}`;
    const { data: profiles } = await supabase
      .from('admin_users')
      .select('full_name,email,role')
      .or(filter)
      .limit(1);
    const profile = (profiles?.[0] || null) as AdminProfile | null;

    const payload = {
      module: input.module,
      action: input.action,
      entity_type: input.entityType || null,
      entity_id: input.entityId || null,
      entity_label: input.entityLabel || null,
      actor_user_id: authUser.id,
      actor_name: profile?.full_name || authEmail || 'Portal User',
      actor_email: profile?.email || authEmail || null,
      actor_role: profile?.role || null,
      summary: input.summary,
      metadata: input.metadata || {}
    };

    const { error } = await supabase.from('audit_logs').insert(payload);
    return error ? { ok: false, error: error.message } : { ok: true, error: '' };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to save audit log.'
    };
  }
}
