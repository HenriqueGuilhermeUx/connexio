import { supabase } from '@/lib/supabase';
import { LodgeRole } from '@/types';

export type LodgeObligation = {
  id: string;
  lodgeId: string;
  title: string;
  description?: string;
  dueDate: string;
  responsibleRole: Extract<LodgeRole, 'SECRETARY' | 'TREASURER' | 'WORSHIPFUL_MASTER'>;
  recurrence: 'NONE' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  reminderDays: number;
  status: 'OPEN' | 'DONE' | 'CANCELED';
};

export async function loadObligations(lodgeId: string): Promise<LodgeObligation[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('lodge_obligations')
    .select('*')
    .eq('lodge_id', lodgeId)
    .order('due_date', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    lodgeId: row.lodge_id,
    title: row.title,
    description: row.description ?? undefined,
    dueDate: row.due_date,
    responsibleRole: row.responsible_role,
    recurrence: row.recurrence,
    reminderDays: row.reminder_days,
    status: row.status,
  }));
}

export async function createObligation(
  lodgeId: string,
  input: Omit<LodgeObligation, 'id' | 'lodgeId' | 'status'>,
) {
  if (!supabase) return null;
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) return null;

  const { data, error } = await supabase
    .from('lodge_obligations')
    .insert({
      lodge_id: lodgeId,
      title: input.title,
      description: input.description ?? null,
      due_date: input.dueDate,
      responsible_role: input.responsibleRole,
      recurrence: input.recurrence,
      reminder_days: input.reminderDays,
      created_by: authData.user.id,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function completeObligation(id: string) {
  if (!supabase) return false;
  const { error } = await supabase
    .from('lodge_obligations')
    .update({ status: 'DONE', completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
  return true;
}
