import { supabase } from '@/lib/supabase';

export type CredentialVerification = {
  valid: boolean;
  memberName: string;
  lodgeName: string;
  lodgeNumber?: string;
  orient: string;
  role: string;
  issuedAt: string;
};

export async function getMemberCredentialToken(membershipId: string) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('member_credentials')
    .select('verification_token')
    .eq('membership_id', membershipId)
    .eq('status', 'ACTIVE')
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.verification_token as string | null | undefined;
}

export async function verifyMemberCredential(token: string): Promise<CredentialVerification | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('verify_member_credential', { token });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : null;
  if (!row) return null;
  return {
    valid: Boolean(row.valid),
    memberName: row.member_name,
    lodgeName: row.lodge_name,
    lodgeNumber: row.lodge_number ?? undefined,
    orient: row.orient,
    role: row.role,
    issuedAt: row.issued_at,
  };
}

export function buildCredentialVerificationUrl(token: string) {
  const appUrl = process.env.EXPO_PUBLIC_APP_URL?.replace(/\/$/, '');
  return appUrl
    ? `${appUrl}/verify-credential?token=${encodeURIComponent(token)}`
    : `connexio://verify-credential?token=${encodeURIComponent(token)}`;
}
