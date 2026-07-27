import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const allowedOrigins = new Set([
  'https://edrivedubai.ae',
  'https://www.edrivedubai.ae',
  'http://localhost:3000'
]);
const allowedRoles = new Set(['super_admin', 'admin', 'booking_staff', 'manager', 'finance']);
const allowedStatuses = new Set(['active', 'inactive', 'suspended']);

function corsHeaders(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin && allowedOrigins.has(origin) ? origin : 'https://edrivedubai.ae',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin'
  };
}

function response(origin: string | null, status: number, payload: Record<string, unknown>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' }
  });
}

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function validPassword(value: string) {
  return value.length >= 12 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);
}

Deno.serve(async (request) => {
  const origin = request.headers.get('Origin');
  if (origin && !allowedOrigins.has(origin)) return response(origin, 403, { error: 'This origin is not allowed.' });
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin) });
  if (request.method !== 'POST') return response(origin, 405, { error: 'Method not allowed.' });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) return response(origin, 500, { error: 'Provisioning is not configured.' });

  const authorization = request.headers.get('Authorization');
  const token = authorization?.replace(/^Bearer\s+/i, '');
  if (!token) return response(origin, 401, { error: 'A valid signed-in session is required.' });

  const adminClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const callerClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
  const { data: userData, error: userError } = await callerClient.auth.getUser(token);
  if (userError || !userData.user) return response(origin, 401, { error: 'A valid signed-in session is required.' });

  const { data: callers, error: callerError } = await adminClient
    .from('admin_users')
    .select('id,auth_user_id,full_name,email,role,status')
    .eq('auth_user_id', userData.user.id)
    .limit(2);
  if (callerError) return response(origin, 500, { error: 'Unable to verify portal authorization.' });
  if (!callers || callers.length !== 1 || String(callers[0].status).toLowerCase() !== 'active' || String(callers[0].role).toLowerCase() !== 'super_admin') {
    return response(origin, 403, { error: 'Only one active Super Admin profile may provision portal users.' });
  }
  const caller = callers[0];

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return response(origin, 400, { error: 'A valid JSON request body is required.' });
  }
  const accountType = clean(body.account_type);
  if (accountType !== 'internal_user' && accountType !== 'b2b_agent') return response(origin, 400, { error: 'Account type must be internal_user or b2b_agent.' });
  const email = clean(body.email).toLowerCase();
  const password = clean(body.initial_password);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return response(origin, 400, { error: 'A valid login email is required.' });
  if (!validPassword(password)) return response(origin, 400, { error: 'Password must be at least 12 characters and include uppercase, lowercase, number, and special characters.' });

  const [{ data: staffLinks }, { data: agentLoginLinks }, { data: agentEmailLinks }] = await Promise.all([
    adminClient.from('admin_users').select('id').ilike('email', email).limit(1),
    adminClient.from('b2b_agents').select('id').ilike('login_email', email).limit(1),
    adminClient.from('b2b_agents').select('id').ilike('email', email).limit(1)
  ]);
  if (staffLinks?.length) return response(origin, 409, { error: 'This email is already linked to an internal portal profile.' });
  if (agentLoginLinks?.length || agentEmailLinks?.length) return response(origin, 409, { error: 'This email is already linked to a B2B Agent profile.' });

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      account_type: accountType,
      provisioned_by: caller.id,
      must_change_password: true
    }
  });
  if (createError || !created.user) {
    const conflict = /already|registered|exists/i.test(createError?.message || '');
    return response(origin, conflict ? 409 : 400, { error: conflict ? 'An Auth user already exists for this email.' : 'Unable to create the Auth user.' });
  }

  const authUserId = created.user.id;
  try {
    if (accountType === 'internal_user') {
      const role = clean(body.role);
      const status = clean(body.status).toLowerCase();
      const fullName = clean(body.full_name);
      const department = clean(body.department);
      const nationality = clean(body.nationality);
      if (!fullName || !department || !nationality || !allowedRoles.has(role) || !allowedStatuses.has(status)) {
        throw new Error('Internal user profile fields are incomplete or invalid.');
      }
      const { data: profile, error: profileError } = await adminClient.from('admin_users').insert({
        auth_user_id: authUserId,
        full_name: fullName,
        email,
        phone: clean(body.phone) || null,
        nationality,
        role,
        department,
        status,
        avatar_url: clean(body.avatar_url) || null,
        notes: clean(body.notes) || null
      }).select('id').single();
      if (profileError || !profile) throw new Error('Internal user profile creation failed.');

      const { error: auditError } = await adminClient.from('audit_logs').insert({
        module: 'team',
        action: 'portal_user_provisioned',
        entity_type: 'admin_user',
        entity_id: profile.id,
        entity_label: fullName,
        actor_user_id: userData.user.id,
        actor_name: caller.full_name || caller.email,
        actor_email: caller.email,
        actor_role: caller.role,
        summary: 'Provisioned an internal portal user.',
        metadata: { account_type: accountType, role, department, status }
      });
      if (auditError) {
        await adminClient.from('admin_users').delete().eq('id', profile.id);
        throw new Error('Provisioning audit creation failed.');
      }
      return response(origin, 201, { account_type: accountType, auth_user_id: authUserId, profile_id: profile.id });
    }

    const profileBody = typeof body.profile === 'object' && body.profile !== null ? body.profile as Record<string, unknown> : {};
    const { data: profile, error: profileError } = await callerClient.rpc('manage_b2b_agent_profile', {
      p_agent_id: null,
      p_auth_user_id: authUserId,
      p_profile: { ...profileBody, login_email: email, email }
    });
    if (profileError || !profile?.id) throw new Error('B2B Agent profile creation failed.');
    return response(origin, 201, { account_type: accountType, auth_user_id: authUserId, profile_id: profile.id });
  } catch {
    await adminClient.auth.admin.deleteUser(authUserId);
    return response(origin, 400, { error: 'The database profile could not be created. The new Auth user was rolled back.' });
  }
});
