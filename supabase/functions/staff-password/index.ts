import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

type StaffPasswordMode = 'send-reset' | 'set-password';

type StaffPasswordPayload = {
  email?: string;
  mode?: StaffPasswordMode;
  password?: string;
  redirectTo?: string;
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

function cleanEmail(value?: string) {
  return String(value || '').trim().toLowerCase();
}

function isAllowedAdmin(role?: string) {
  return ['super_admin', 'admin', 'manager'].includes(String(role || ''));
}

async function findAuthUserByEmail(adminClient: ReturnType<typeof createClient>, email: string) {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const match = data.users.find((user) => user.email?.toLowerCase() === email);
    if (match) return match;
    if (data.users.length < 1000) return null;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'Missing Supabase function secrets' }, 500);
  }

  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '').trim();

  if (!token) return jsonResponse({ error: 'Login session is required' }, 401);

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: callerData, error: callerError } = await adminClient.auth.getUser(token);
  const caller = callerData.user;

  if (callerError || !caller) return jsonResponse({ error: 'Invalid login session' }, 401);

  const { data: callerProfile, error: profileError } = await adminClient
    .from('admin_users')
    .select('id, role, status')
    .eq('auth_user_id', caller.id)
    .maybeSingle();

  if (profileError) return jsonResponse({ error: profileError.message }, 500);
  if (!callerProfile || callerProfile.status !== 'active' || !isAllowedAdmin(callerProfile.role)) {
    return jsonResponse({ error: 'You do not have permission to manage staff passwords' }, 403);
  }

  let payload: StaffPasswordPayload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid request body' }, 400);
  }

  const email = cleanEmail(payload.email);
  const mode = payload.mode || 'send-reset';
  const redirectTo = payload.redirectTo || undefined;

  if (!email || !email.includes('@')) return jsonResponse({ error: 'Valid staff email is required' }, 400);
  if (!['send-reset', 'set-password'].includes(mode)) return jsonResponse({ error: 'Invalid password action' }, 400);
  if (mode === 'set-password' && (!payload.password || payload.password.length < 8)) {
    return jsonResponse({ error: 'Temporary password must be at least 8 characters' }, 400);
  }

  const { data: staffRecord, error: staffError } = await adminClient
    .from('admin_users')
    .select('id, email, full_name, auth_user_id, status')
    .eq('email', email)
    .maybeSingle();

  if (staffError) return jsonResponse({ error: staffError.message }, 500);
  if (!staffRecord) return jsonResponse({ error: 'No staff record found with this email' }, 404);

  let authUserId = staffRecord.auth_user_id as string | null;

  if (!authUserId) {
    const existingUser = await findAuthUserByEmail(adminClient, email);
    if (existingUser) {
      authUserId = existingUser.id;
    } else if (mode === 'set-password') {
      const { data: createdUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password: payload.password,
        email_confirm: true,
        user_metadata: { full_name: staffRecord.full_name || '' }
      });
      if (createError || !createdUser.user) return jsonResponse({ error: createError?.message || 'Unable to create auth user' }, 500);
      authUserId = createdUser.user.id;
    } else {
      const { data: invitedUser, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
        redirectTo
      });
      if (inviteError || !invitedUser.user) return jsonResponse({ error: inviteError?.message || 'Unable to invite staff user' }, 500);
      authUserId = invitedUser.user.id;
    }

    const { error: linkError } = await adminClient
      .from('admin_users')
      .update({ auth_user_id: authUserId })
      .eq('id', staffRecord.id);

    if (linkError) return jsonResponse({ error: linkError.message }, 500);
  }

  if (mode === 'set-password') {
    const { error: updateError } = await adminClient.auth.admin.updateUserById(authUserId, {
      password: payload.password,
      email_confirm: true
    });
    if (updateError) return jsonResponse({ error: updateError.message }, 500);
    return jsonResponse({ message: 'Temporary password has been set successfully.', authUserId });
  }

  const { error: resetError } = await adminClient.auth.resetPasswordForEmail(email, { redirectTo });
  if (resetError) return jsonResponse({ error: resetError.message }, 500);

  return jsonResponse({ message: 'Password reset email has been sent successfully.', authUserId });
});
