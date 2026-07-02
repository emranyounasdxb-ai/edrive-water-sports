import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';

type CouponInsert = Database['public']['Tables']['coupons']['Insert'];
type CouponUpdate = Database['public']['Tables']['coupons']['Update'];

export async function listCoupons() {
  const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createCoupon(payload: CouponInsert) {
  const normalized = { ...payload, code: payload.code.trim().toUpperCase() };
  const { data, error } = await supabase.from('coupons').insert(normalized).select('*').single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateCoupon(couponId: string, payload: CouponUpdate) {
  const { data, error } = await supabase.from('coupons').update(payload).eq('id', couponId).select('*').single();
  if (error) throw new Error(error.message);
  return data;
}
