import { supabase } from '@/lib/supabase';

export type PeopleSnapshot = {
  member_id: string;
  member_name: string;
  degree: 'APPRENTICE' | 'COMPANION' | 'MASTER';
  last_attendance_at: string | null;
  attendance_count: number;
  next_followup_at: string | null;
  followup_status: 'OK' | 'ATTENTION' | 'URGENT';
  leadership_potential: 'UNASSESSED' | 'DEVELOPING' | 'HIGH';
};

export type CandidateStage = 'OBSERVATION' | 'SOCIAL_EVENTS' | 'INTERVIEW' | 'INQUIRY' | 'LODGE_DISCUSSION' | 'READY' | 'CLOSED';

export async function refreshOperationalTasks(lodgeId: string) {
  if (!supabase) return 0;
  const { data, error } = await supabase.rpc('refresh_lodge_operational_tasks', { target_lodge: lodgeId });
  if (error) throw error;
  return Number(data ?? 0);
}

export async function loadPeopleSnapshot(lodgeId: string): Promise<PeopleSnapshot[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.rpc('lodge_people_snapshot', { target_lodge: lodgeId });
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    ...row,
    attendance_count: Number(row.attendance_count ?? 0),
  })) as PeopleSnapshot[];
}

export async function saveMemberCare(lodgeId: string, memberId: string, input: {
  degree: PeopleSnapshot['degree'];
  nextFollowupAt?: string;
  followupStatus: PeopleSnapshot['followup_status'];
  leadershipPotential: PeopleSnapshot['leadership_potential'];
  privateNotes?: string;
}) {
  if (!supabase) return null;
  const { data: auth } = await supabase.auth.getUser();
  const { data, error } = await supabase.from('lodge_member_care').upsert({
    lodge_id: lodgeId,
    member_id: memberId,
    degree: input.degree,
    last_contact_at: new Date().toISOString(),
    next_followup_at: input.nextFollowupAt || null,
    followup_status: input.followupStatus,
    leadership_potential: input.leadershipPotential,
    private_notes: input.privateNotes || null,
    updated_by: auth.user?.id ?? null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'lodge_id,member_id' }).select('*').single();
  if (error) throw error;
  return data;
}

export async function loadCandidates(lodgeId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('lodge_candidates')
    .select('*,lodge_candidate_checks(*)')
    .eq('lodge_id', lodgeId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createCandidate(lodgeId: string, input: { fullName: string; email?: string; phone?: string; notes?: string }) {
  if (!supabase) return null;
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) return null;
  const { data, error } = await supabase.from('lodge_candidates').insert({
    lodge_id: lodgeId,
    full_name: input.fullName,
    email: input.email || null,
    phone: input.phone || null,
    notes: input.notes || null,
    created_by: auth.user.id,
  }).select('*').single();
  if (error) throw error;

  const checks = [
    ['FAMILY', 'Vida familiar'],
    ['PROFESSIONAL', 'Vida profissional'],
    ['FINANCIAL', 'Condição financeira'],
    ['REPUTATION', 'Reputação'],
    ['INTERVIEW', 'Entrevista realizada'],
  ].map(([item_key, label]) => ({ candidate_id: data.id, item_key, label }));
  const { error: checksError } = await supabase.from('lodge_candidate_checks').insert(checks);
  if (checksError) throw checksError;
  return data;
}

export async function updateCandidateStage(candidateId: string, stage: CandidateStage) {
  if (!supabase) return;
  const { error } = await supabase.from('lodge_candidates').update({ stage, updated_at: new Date().toISOString() }).eq('id', candidateId);
  if (error) throw error;
}

export async function toggleCandidateCheck(checkId: string, done: boolean) {
  if (!supabase) return;
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase.from('lodge_candidate_checks').update({ is_done: done, updated_by: auth.user?.id ?? null, updated_at: new Date().toISOString() }).eq('id', checkId);
  if (error) throw error;
}

export async function seedLearningPath(lodgeId: string) {
  if (!supabase) return 0;
  const { data, error } = await supabase.rpc('seed_lodge_learning_path', { target_lodge: lodgeId });
  if (error) throw error;
  return Number(data ?? 0);
}

export async function loadLearningItems(lodgeId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase.from('lodge_learning_items').select('*').eq('lodge_id', lodgeId).eq('active', true).order('audience').order('created_at');
  if (error) throw error;
  return data ?? [];
}

export async function createLearningItem(lodgeId: string, input: { title: string; audience: string; description?: string; category?: string }) {
  if (!supabase) return null;
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) return null;
  const { data, error } = await supabase.from('lodge_learning_items').insert({
    lodge_id: lodgeId,
    title: input.title,
    audience: input.audience,
    description: input.description || null,
    category: input.category || 'EDUCATION',
    created_by: auth.user.id,
  }).select('*').single();
  if (error) throw error;
  return data;
}

export async function seedHandover(lodgeId: string) {
  if (!supabase) return 0;
  const { data, error } = await supabase.rpc('seed_lodge_handover', { target_lodge: lodgeId });
  if (error) throw error;
  return Number(data ?? 0);
}

export async function loadHandover(lodgeId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase.from('lodge_handover_items').select('*').eq('lodge_id', lodgeId).order('category').order('created_at');
  if (error) throw error;
  return data ?? [];
}

export async function setHandoverDone(itemId: string, done: boolean) {
  if (!supabase) return;
  const { error } = await supabase.from('lodge_handover_items').update({
    status: done ? 'DONE' : 'OPEN',
    completed_at: done ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }).eq('id', itemId);
  if (error) throw error;
}
