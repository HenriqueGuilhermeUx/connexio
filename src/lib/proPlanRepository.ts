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

  // Carregamos a fila e as Lojas separadamente. Isso evita falhas de resolução
  // de relacionamento do PostgREST em projetos Supabase que vieram do schema legado.
  const { data: requests, error: requestsError } = await supabase
    .from('lodge_plan_requests')
    .select('id,lodge_id,requested_by,status,created_at')
    .eq('status', 'PENDING')
    .order('created_at', { ascending: true });
  if (requestsError) throw requestsError;

  const rows = requests ?? [];
  if (!rows.length) return [];

  const lodgeIds = [...new Set(rows.map((row) => row.lodge_id))];
  const { data: lodges, error: lodgesError } = await supabase
    .from('lodges')
    .select('id,name,number,orient,region,plan')
    .in('id', lodgeIds);
  if (lodgesError) throw lodgesError;

  const lodgeById = new Map((lodges ?? []).map((lodge) => [lodge.id, lodge]));
  return rows.map((row) => ({ ...row, lodges: lodgeById.get(row.lodge_id) ?? null }));
}

export async function decideGestorProRequest(requestId: string, approve: boolean, note?: string) {
  if (!supabase) return;
  const { error } = await supabase.rpc('admin_decide_lodge_pro_request', { target_request: requestId, approve, note: note || null });
  if (error) throw error;
}
