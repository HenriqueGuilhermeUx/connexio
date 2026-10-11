import { supabase } from '@/lib/supabase';
import { LodgeRole } from '@/types';

export async function persistLodgeInvitation(
  lodgeId: string,
  input: { name: string; email: string; whatsapp?: string; role: LodgeRole },
) {
  if (!supabase) return null;
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!authData.user) return null;

  const { data, error } = await supabase
    .from('lodge_invitations')
    .upsert({
      lodge_id: lodgeId,
      email: input.email.trim().toLowerCase(),
      full_name: input.name.trim(),
      phone: input.whatsapp ?? null,
      role: input.role,
      status: 'PENDING',
      invited_by: authData.user.id,
    }, { onConflict: 'lodge_id,email' })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function persistLodgeMemberRole(lodgeId: string, memberId: string, role: LodgeRole) {
  if (!supabase) return false;
  const { error } = await supabase
    .from('lodge_memberships')
    .update({ role })
    .eq('lodge_id', lodgeId)
    .eq('member_id', memberId);
  if (error) throw error;
  return true;
}

export async function acceptPendingLodgeInvitations() {
  if (!supabase) return 0;
  const { data, error } = await supabase.rpc('accept_lodge_invitations');
  if (error) throw error;
  return Number(data ?? 0);
}
