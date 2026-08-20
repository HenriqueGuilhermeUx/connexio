import { supabase } from '@/lib/supabase';

export type LodgePaymentProfile = {
  lodge_id: string;
  pix_key_type: 'CPF'|'CNPJ'|'EMAIL'|'PHONE'|'RANDOM'|'OTHER';
  pix_key: string;
  beneficiary_name: string;
  bank_name?: string|null;
  instructions?: string|null;
  qr_storage_path?: string|null;
};

export async function loadLodgePaymentProfile(lodgeId: string) {
  if (!supabase) return null;
  const { data, error } = await supabase.from('lodge_payment_profiles').select('*').eq('lodge_id', lodgeId).maybeSingle();
  if (error) throw error;
  return data as LodgePaymentProfile | null;
}

export async function saveLodgePaymentProfile(lodgeId: string, input: {
  pixKeyType: LodgePaymentProfile['pix_key_type'];
  pixKey: string;
  beneficiaryName: string;
  bankName?: string;
  instructions?: string;
  qrStoragePath?: string|null;
}) {
  if (!supabase) throw new Error('Backend indisponível.');
  const { error } = await supabase.rpc('save_lodge_payment_profile', {
    target_lodge: lodgeId,
    target_key_type: input.pixKeyType,
    target_pix_key: input.pixKey,
    target_beneficiary: input.beneficiaryName,
    target_bank_name: input.bankName || null,
    target_instructions: input.instructions || null,
    target_qr_path: input.qrStoragePath || null,
  });
  if (error) throw error;
}

export async function uploadLodgePixQr(lodgeId: string, file: { uri:string; name:string; mimeType?:string|null }) {
  if (!supabase) throw new Error('Backend indisponível.');
  const safeName = file.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z0-9._-]/g,'-');
  const path = `${lodgeId}/${Date.now()}-${Math.random().toString(36).slice(2,9)}-${safeName}`;
  const response = await fetch(file.uri);
  const buffer = await response.arrayBuffer();
  const { error } = await supabase.storage.from('lodge-payment-assets').upload(path, buffer, { contentType:file.mimeType||'image/png', upsert:false });
  if (error) throw error;
  return path;
}

export async function getLodgePixQrUrl(path: string) {
  if (!supabase) return null;
  const { data, error } = await supabase.storage.from('lodge-payment-assets').createSignedUrl(path, 60 * 10);
  if (error) throw error;
  return data.signedUrl;
}

export async function loadLodgeCharges(lodgeId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase.from('lodge_charges')
    .select('id,lodge_id,member_id,member_name,member_email,member_phone,description,amount_cents,due_date,status,provider,paid_at,created_at')
    .eq('lodge_id', lodgeId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row:any) => ({ ...row, amount: Number(row.amount_cents ?? 0) / 100 }));
}

export async function createLodgeCharge(input: { lodgeId:string; memberId?:string; memberName:string; memberEmail?:string; memberPhone?:string; description:string; amount:number; dueDate:string }) {
  if (!supabase) throw new Error('Backend indisponível.');
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!auth.user) throw new Error('Faça login novamente.');
  const { data, error } = await supabase.from('lodge_charges').insert({
    lodge_id: input.lodgeId,
    member_id: input.memberId || null,
    member_name: input.memberName,
    member_email: input.memberEmail || null,
    member_phone: input.memberPhone || null,
    description: input.description,
    amount_cents: Math.round(input.amount * 100),
    due_date: input.dueDate,
    status: 'PENDING',
    provider: 'MANUAL_PIX',
    created_by: auth.user.id,
  }).select('id').single();
  if (error) throw error;
  return data.id as string;
}

export async function markLodgeChargePaid(chargeId: string) {
  if (!supabase) throw new Error('Backend indisponível.');
  const { error } = await supabase.rpc('mark_lodge_charge_paid', { target_charge: chargeId });
  if (error) throw error;
}

export async function createGestorProPix(requestId: string) {
  if (!supabase) throw new Error('Backend indisponível.');
  const { data, error } = await supabase.functions.invoke('create-woovi-charge', { body: { mode: 'GESTOR_PRO', requestId } });
  if (error) throw error;
  if (!data?.ok) throw new Error(data?.error || 'Não foi possível gerar o Pix do Gestor Pro.');
  return data.payment as { correlationID:string; brCode?:string|null; qrCodeImage?:string|null; paymentLinkUrl?:string|null };
}
