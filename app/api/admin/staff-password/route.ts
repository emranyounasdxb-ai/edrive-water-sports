import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonError('Missing server Supabase configuration.', 500);
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
  if (!callerProfile || callerProfile.status !== 'active' || !isAllowedAdmin(String(callerProfile.role || ''))) {
    return jsonError('You do not have permission to manage staff access.', 403);
  }

  let payload: StaffPasswordPayload;
  try {
    payload = await request.json();
  } catch {
    return jsonError('Invalid request body.', 400);
  }

  const email = cleanEmail(payload.email);
  const mode = payload.mode || 'send-reset';
  const accessValue = String(payload.password || '');

  if (!email || !email.includes('@')) return jsonError('Valid staff email is required.', 400);
  if (!['send-reset', 'set-password'].includes(mode)) return jsonError('Invalid access action.', 400);
  if (mode === 'set-password' && accessValue.length < 8) {
    return jsonError('Temporary value must be at least 8 characters.', 400);
  }

  const { data: staffRecord, error: staffError } = await adminClient
    .from('admin_users')
    .select('id, email, full_name, auth_user_id, status')
    .eq('email', email)
    .maybeSingle();

  if (staffError) return jsonError(staffError.message, 500);
  if (!staffRecord) return jsonError('No staff record found with this email.', 404);

  let authUserId = '';

  try {
    let existingAuthUserId = '';
    for (let page = 1; page <= 20; page += 1) {
      const { data: listData, error: listError } = await adminClient.auth.admin.listUsers({ page, perPage: 1000 });
      if (listError) throw listError;
      const match = listData.users.find((user) => user.email?.toLowerCase() === email);
      if (match) {
        existingAuthUserId = match.id;
        break;
      }
      if (listData.users.length < 1000) break;
    }

    if (existingAuthUserId) {
      authUserId = existingAuthUserId;
    } else if (mode === 'set-password') {
      const { data: createdUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password: accessValue,
        email_confirm: true,
        user_metadata: { full_name: String(staffRecord.full_name || ''), name: String(staffRecord.full_name || '') }
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

    if (!authUserId) return jsonError('Unable to link staff login user.', 500);

    if (staffRecord.auth_user_id !== authUserId) {
      const { error: linkError } = await adminClient
        .from('admin_users')
        .update({ auth_user_id: authUserId })
        .eq('id', staffRecord.id);

      if (linkError) return jsonError(linkError.message, 500);
    }

    if (mode === 'set-password') {
      const { error: updateError } = await adminClient.auth.admin.updateUserById(authUserId, {
        password: accessValue,
        email_confirm: true,
        user_metadata: { full_name: String(staffRecord.full_name || ''), name: String(staffRecord.full_name || '') }
      });
      if (updateError) return jsonError(updateError.message, 500);

      return NextResponse.json({
        message: 'Staff login has been linked to the current email successfully.',
        authUserId
      });
    }

    const { error: resetError } = await adminClient.auth.resetPasswordForEmail(email, {
      redirectTo: payload.redirectTo
    });
    if (resetError) return jsonError(resetError.message, 500);

    return NextResponse.json({ message: 'Staff login has been linked to the current email and reset email has been sent.', authUserId });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to complete staff access action.', 500);
  }
}
