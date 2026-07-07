import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type StaffPasswordMode = 'send-reset' | 'set-password';

type StaffPasswordPayload = {
  email?: string;
  mode?: StaffPasswordMode;
  password?: string;
  redirectTo?: string;
};

function cleanEmail(value?: string) {
  return String(value || '').trim().toLowerCase();
}

function isAllowedAdmin(role?: string) {
  return ['super_admin', 'admin', 'manager'].includes(String(role || ''));
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
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

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonError('Missing server Supabase service role configuration.', 500);
  }

  const token = request.headers.get('authorization')?.replace('Bearer ', '').trim();
  if (!token) return jsonError('Admin login session is required.', 401);

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { data: callerData, error: callerError } = await adminClient.auth.getUser(token);
  const caller = callerData.user;
  if (callerError || !caller) return jsonError('Invalid admin login session.', 401);

  const { data: callerProfile, error: profileError } = await adminClient
    .from('admin_users')
    .select('id, role, status')
    .eq('auth_user_id', caller.id)
    .maybeSingle();

  if (profileError) return jsonError(profileError.message, 500);
  if (!callerProfile || callerProfile.status !== 'active' || !isAllowedAdmin(callerProfile.role)) {
    return jsonError('You do not have permission to manage staff passwords.', 403);
  }

  let payload: StaffPasswordPayload;
  try {
    payload = await request.json();
  } catch {
    return jsonError('Invalid request body.', 400);
  }

  const email = cleanEmail(payload.email);
  const mode = payload.mode || 'send-reset';

  if (!email || !email.includes('@')) return jsonError('Valid staff email is required.', 400);
  if (!['send-reset', 'set-password'].includes(mode)) return jsonError('Invalid password action.', 400);
  if (mode === 'set-password' && (!payload.password || payload.password.length < 8)) {
    return jsonError('Temporary password must be at least 8 characters.', 400);
  }

  const { data: staffRecord, error: staffError } = await adminClient
    .from('admin_users')
    .select('id, email, full_name, auth_user_id, status')
    .eq('email', email)
    .maybeSingle();

  if (staffError) return jsonError(staffError.message, 500);
  if (!staffRecord) return jsonError('No staff record found with this email.', 404);

  let authUserId = staffRecord.auth_user_id as string | null;

  try {
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
        if (createError || !createdUser.user) return jsonError(createError?.message || 'Unable to create staff login user.', 500);
        authUserId = createdUser.user.id;
      } else {
        const { data: invitedUser, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
          redirectTo: payload.redirectTo
        });
        if (inviteError || !invitedUser.user) return jsonError(inviteError?.message || 'Unable to invite staff user.', 500);
        authUserId = invitedUser.user.id;
      }

      const { error: linkError } = await adminClient
        .from('admin_users')
        .update({ auth_user_id: authUserId })
        .eq('id', staffRecord.id);

      if (linkError) return jsonError(linkError.message, 500);
    }

    if (mode === 'set-password') {
      const { error: updateError } = await adminClient.auth.admin.updateUserById(authUserId, {
        password: payload.password,
        email_confirm: true
      });
      if (updateError) return jsonError(updateError.message, 500);

      return NextResponse.json({
        message: 'Temporary password has been saved in Supabase Auth. Staff can now login with this email and password.',
        authUserId
      });
    }

    const { error: resetError } = await adminClient.auth.resetPasswordForEmail(email, {
      redirectTo: payload.redirectTo
    });
    if (resetError) return jsonError(resetError.message, 500);

    return NextResponse.json({ message: 'Password reset email has been sent successfully.', authUserId });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to complete staff password action.', 500);
  }
}
