import { supabase } from '@/lib/supabase/client';

export async function loginStaff(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data;
}

export async function logoutStaff() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}
