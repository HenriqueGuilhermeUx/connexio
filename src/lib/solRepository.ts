import { supabase } from '@/lib/supabase';

async function userId() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user?.id ?? null;
}

export async function loadTodayTasks(lodgeId: string) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('lodge_management_tasks')
    .select('*')
    .eq('lodge_id', lodgeId)
    .neq('status', 'CANCELLED')
    .order('status', { ascending: false })
    .order('due_at', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data ?? [];
}

export async function createManagementTask(lodgeId: string, title: string, dueAt?: string, source = 'MANUAL') {
  if (!supabase) return null;
  const actor = await userId();
  if (!actor) return null;
  const { data, error } = await supabase.from('lodge_management_tasks').insert({ lodge_id: lodgeId, title, due_at: dueAt ?? null, source, created_by: actor }).select('*').single();
  if (error) throw error;
  return data;
}

export async function setManagementTaskDone(id: string, done: boolean) {
  if (!supabase) return;
  const { error } = await supabase.from('lodge_management_tasks').update({ status: done ? 'DONE' : 'OPEN', completed_at: done ? new Date().toISOString() : null, updated_at: new Date().toISOString() }).eq('id', id);
  if (error) throw error;
}

export async function loadHealthSnapshot(lodgeId: string) {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('lodge_health_snapshot', { target_lodge: lodgeId });
  if (error) throw error;
  return data as { attendance_rate: number; overdue_rate: number; projects_done_rate: number; member_count: number };
}

export async function loadSessions(lodgeId: string) {
  if (!supabase) return null;
  const { data, error } = await supabase.from('lodge_sessions').select('*,lodge_attendance(member_id,checked_in_at,method)').eq('lodge_id', lodgeId).order('starts_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createSession(lodgeId: string, title: string, startsAt: string, objective?: string) {
  if (!supabase) return null;
  const actor = await userId();
  if (!actor) return null;
  const { data, error } = await supabase.from('lodge_sessions').insert({ lodge_id: lodgeId, title, starts_at: startsAt, objective: objective ?? null, created_by: actor }).select('*').single();
  if (error) throw error;
  return data;
}

export async function checkInCredential(sessionId: string, token: string) {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('check_in_member_by_credential', { target_session: sessionId, credential_token: token });
  if (error) throw error;
  return data;
}

export async function loadAnnualPlan(lodgeId: string, year: number) {
  if (!supabase) return null;
  const { data: plan, error } = await supabase.from('lodge_annual_plans').select('*').eq('lodge_id', lodgeId).eq('year', year).maybeSingle();
  if (error) throw error;
  if (!plan) return null;
  const [{ data: goals, error: goalsError }, { data: projects, error: projectsError }] = await Promise.all([
    supabase.from('lodge_goals').select('*').eq('plan_id', plan.id).order('created_at'),
    supabase.from('lodge_projects').select('*').eq('plan_id', plan.id).order('created_at'),
  ]);
  if (goalsError) throw goalsError;
  if (projectsError) throw projectsError;
  return { plan, goals: goals ?? [], projects: projects ?? [] };
}

export async function ensureAnnualPlan(lodgeId: string, year: number, vision?: string) {
  if (!supabase) return null;
  const actor = await userId();
  if (!actor) return null;
  const { data, error } = await supabase.from('lodge_annual_plans').upsert({ lodge_id: lodgeId, year, vision: vision ?? null, status: 'ACTIVE', created_by: actor }, { onConflict: 'lodge_id,year' }).select('*').single();
  if (error) throw error;
  return data;
}

export async function addGoal(planId: string, title: string, metric?: string, target?: number) {
  if (!supabase) return null;
  const { data, error } = await supabase.from('lodge_goals').insert({ plan_id: planId, title, metric: metric ?? null, target_value: target ?? null }).select('*').single();
  if (error) throw error;
  return data;
}

export async function addProject(planId: string, title: string, dueDate?: string) {
  if (!supabase) return null;
  const { data, error } = await supabase.from('lodge_projects').insert({ plan_id: planId, title, due_date: dueDate ?? null, status: 'PLANNED' }).select('*').single();
  if (error) throw error;
  return data;
}

export async function loadMinutes(lodgeId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase.from('lodge_minutes').select('*').eq('lodge_id', lodgeId).order('meeting_date', { ascending: false }).order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function saveMinutes(lodgeId: string, input: {
  meetingDate: string;
  sessionLabel: string;
  matters: string;
  decisions: string;
  pendingItems: string;
  closingNotes: string;
  sessionId?: string | null;
  location?: string;
  transcript?: string;
  generatedText?: string;
  attendanceSnapshot?: unknown[];
}) {
  if (!supabase) return null;
  const actor = await userId();
  if (!actor) return null;
  const { data, error } = await supabase.from('lodge_minutes').insert({
    lodge_id: lodgeId,
    meeting_date: input.meetingDate,
    session_label: input.sessionLabel,
    matters: input.matters,
    decisions: input.decisions,
    pending_items: input.pendingItems,
    closing_notes: input.closingNotes,
    session_id: input.sessionId ?? null,
    location: input.location || null,
    transcript: input.transcript || null,
    generated_text: input.generatedText || null,
    attendance_snapshot: input.attendanceSnapshot ?? [],
    created_by: actor,
  }).select('*').single();
  if (error) throw error;
  return data;
}

export async function updateMinutes(minutesId: string, input: Partial<{
  matters: string;
  decisions: string;
  pending_items: string;
  closing_notes: string;
  transcript: string;
  generated_text: string;
  audience: string;
}>) {
  if (!supabase) return null;
  const { data, error } = await supabase.from('lodge_minutes').update({ ...input, updated_at: new Date().toISOString() }).eq('id', minutesId).select('*').single();
  if (error) throw error;
  return data;
}

export async function submitMinutesForReview(minutesId: string) {
  if (!supabase) return;
  const { error } = await supabase.rpc('submit_minutes_for_review', { target_minutes: minutesId });
  if (error) throw error;
}

export async function approveMinutes(minutesId: string) {
  if (!supabase) return;
  const { error } = await supabase.rpc('approve_minutes', { target_minutes: minutesId });
  if (error) throw error;
}

export async function publishMinutes(minutesId: string, audience = 'ALL') {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('publish_minutes', { target_minutes: minutesId, target_audience: audience });
  if (error) throw error;
  return data as string | null;
}
