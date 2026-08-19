import { supabase } from '@/lib/supabase';

export async function requestGestorPro(lodgeId: string) {
  if (!supabase) return null;
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) throw new Error('Faça login novamente.');
  const { data, error } = await supabase.from('lodge_plan_requests').insert({ lodge_id: lodgeId, requested_by: auth.user.id, requested_plan: 'PRO' }).select('*').single();
  if (error && error.code !== '23505') throw error;
  if (error?.code === '23505') {
    const { data: existing, error: existingError } = await supabase.from('lodge_plan_requests').select('*').eq('lodge_id', lodgeId).eq('status', 'PENDING').maybeSingle();
    if (existingError) throw existingError;
    return existing;
  }
  return data;
}

export async function loadLatestGestorProRequest(lodgeId: string) {
  if (!supabase) return null;
  const { data, error } = await supabase.from('lodge_plan_requests').select('*').eq('lodge_id', lodgeId).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

export async function loadPendingGestorProRequests() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('lodge_plan_requests')
    .select('id,lodge_id,requested_by,status,created_at,lodges(name,number,orient,region,plan),member_profiles!lodge_plan_requests_requested_by_fkey(full_name,email)')
    .eq('status', 'PENDING')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function decideGestorProRequest(requestId: string, approve: boolean, note?: string) {
  if (!supabase) return;
  const { error } = await supabase.rpc('admin_decide_lodge_pro_request', { target_request: requestId, approve, note: note || null });
  if (error) throw error;
}
