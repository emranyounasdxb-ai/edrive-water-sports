import { supabase } from '@/lib/supabase/client';

export async function listStaffUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('id,full_name,email,phone,is_active,created_at,roles(slug,name)')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}
