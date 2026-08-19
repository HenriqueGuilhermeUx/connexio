import { supabase } from '@/lib/supabase';
import { LodgeRole, ManagementRequest } from '@/types';

export type AdminMemberRequest = {
  id: string;
  name: string;
  email: string;
  cim: string;
  lodge: string;
  city: string;
};

export async function loadAdminQueues() {
  if (!supabase) return null;

  const [membersResult, managementResult] = await Promise.all([
    supabase.from('admin_member_queue').select('*').order('created_at', { ascending: true }),
    supabase.from('management_requests').select('*').eq('status', 'PENDING').order('created_at', { ascending: true }),
  ]);
  if (membersResult.error) throw membersResult.error;
  if (managementResult.error) throw managementResult.error;

  const managementRows = managementResult.data ?? [];
  const requesterIds = [...new Set(managementRows.map((row) => row.requester_id))];
  const profilesResult = requesterIds.length
    ? await supabase.from('member_profiles').select('id,full_name,email').in('id', requesterIds)
    : { data: [], error: null };
  if (profilesResult.error) throw profilesResult.error;
  const profiles = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile]));

  const members: AdminMemberRequest[] = (membersResult.data ?? []).map((row) => ({
    id: row.id,
    name: row.full_name,
    email: row.email,
    cim: row.cim_last4 ? `•••• ${row.cim_last4}` : '••••',
    lodge: row.lodge_name,
    city: row.city,
  }));

  const managers: ManagementRequest[] = managementRows.map((row) => {
    const profile = profiles.get(row.requester_id);
    return {
      id: row.id,
      requesterId: row.requester_id,
      requesterName: profile?.full_name ?? 'Membro Connexio',
      requesterEmail: profile?.email ?? '',
      lodgeName: row.lodge_name,
      lodgeNumber: row.lodge_number ?? undefined,
      orient: row.orient,
      region: row.region,
      requestedRole: row.requested_role as Extract<LodgeRole, 'SECRETARY' | 'TREASURER' | 'WORSHIPFUL_MASTER'>,
      evidenceName: row.evidence_name,
      evidencePath: row.evidence_path,
      evidenceType: row.evidence_type,
      notes: row.notes ?? undefined,
      status: row.status,
      createdAt: row.created_at,
      decidedAt: row.decided_at ?? undefined,
    };
  });

  return { members, managers };
}

export async function decideMemberRemote(userId: string, approved: boolean) {
  if (!supabase) return false;
  const { error } = await supabase.rpc('approve_connexio_member', {
    target_user: userId,
    approved,
    reason: null,
  });
  if (error) throw error;
  return true;
}

export async function decideManagerRemote(requestId: string, approved: boolean) {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('decide_management_request', {
    target_request: requestId,
    approved,
    reason: null,
  });
  if (error) throw error;
  return data as string | null;
}

export async function getManagerEvidenceUrl(path: string) {
  if (!supabase) return null;
  const { data, error } = await supabase.storage.from('manager-evidence').createSignedUrl(path, 300);
  if (error) throw error;
  return data.signedUrl;
}
