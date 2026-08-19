import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { Lodge, Membership, Member } from '@/types';

export type RegistrationInput = {
  name: string;
  email: string;
  password: string;
  whatsapp: string;
  cim: string;
  lodge: string;
  city: string;
  region: string;
};

export async function registerConnexio(input: RegistrationInput) {
  if (!isSupabaseConfigured || !supabase) return { mode: 'LOCAL' as const };

  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim().toLowerCase(),
    password: input.password,
    options: {
      data: {
        full_name: input.name.trim(),
        phone: input.whatsapp.trim(),
        cim_number: input.cim.trim(),
        lodge_name: input.lodge.trim(),
        city: input.city.trim(),
        region: input.region.trim(),
      },
    },
  });
  if (error) throw error;
  return { mode: 'REMOTE' as const, userId: data.user?.id };
}

export async function signInConnexio(email: string, password: string) {
  if (!isSupabaseConfigured || !supabase) return null;

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (authError) throw authError;

  const userId = authData.user.id;
  const [{ data: profile, error: profileError }, { data: verification, error: verificationError }] = await Promise.all([
    supabase.from('member_profiles').select('*').eq('id', userId).single(),
    supabase.from('member_verifications').select('cim_last4,status').eq('user_id', userId).maybeSingle(),
  ]);
  if (profileError) throw profileError;
  if (verificationError) throw verificationError;

  const member: Member = {
    id: userId,
    name: profile.full_name,
    email: profile.email,
    whatsapp: profile.phone,
    city: profile.city,
    region: profile.region,
    lodge: profile.lodge_name,
    cimMasked: verification?.cim_last4 ? `•••• ${verification.cim_last4}` : '••••',
    status: profile.status,
  };

  const { data: membershipRow, error: membershipError } = await supabase
    .from('lodge_memberships')
    .select('id,lodge_id,role,status,joined_at,verified_at')
    .eq('member_id', userId)
    .eq('status', 'ACTIVE')
    .limit(1)
    .maybeSingle();
  if (membershipError) throw membershipError;

  let lodge: Lodge | null = null;
  let membership: Membership | null = null;
  if (membershipRow) {
    const { data: lodgeRow, error: lodgeError } = await supabase.from('lodges').select('*').eq('id', membershipRow.lodge_id).single();
    if (lodgeError) throw lodgeError;
    lodge = {
      id: lodgeRow.id,
      name: lodgeRow.name,
      number: lodgeRow.number ?? undefined,
      orient: lodgeRow.orient,
      region: lodgeRow.region,
      plan: lodgeRow.plan,
      verified: lodgeRow.verified,
    };
    membership = {
      id: membershipRow.id,
      memberId: userId,
      lodgeId: membershipRow.lodge_id,
      role: membershipRow.role,
      status: membershipRow.status,
      joinedAt: membershipRow.joined_at ?? undefined,
      verifiedAt: membershipRow.verified_at ?? undefined,
    };
  }

  return { member, lodge, membership };
}
