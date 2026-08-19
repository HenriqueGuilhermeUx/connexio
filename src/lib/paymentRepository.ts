import { supabase } from '@/lib/supabase';

export async function configureLodgeWoovi(lodgeId: string, appId: string) {
  if (!supabase) throw new Error('Backend indisponível.');
  const { error } = await supabase.rpc('configure_lodge_woovi', { target_lodge: lodgeId, target_app_id: appId.trim() });
  if (error) throw error;
}

export async function isLodgeWooviConfigured(lodgeId: string) {
  if (!supabase) return false;
  const { data, error } = await supabase.rpc('lodge_woovi_configured', { target_lodge: lodgeId });
  if (error) throw error;
  return Boolean(data);
}

export async function createLodgeChargePix(chargeId: string) {
  if (!supabase) throw new Error('Backend indisponível.');
  const { data, error } = await supabase.functions.invoke('create-woovi-charge', { body: { mode: 'LODGE_CHARGE', chargeId } });
  if (error) throw error;
  if (!data?.ok) throw new Error(data?.error || 'Não foi possível gerar o Pix.');
  return data.charge as { id:string; correlationID:string; brCode?:string|null; qrCodeImage?:string|null; paymentLinkUrl?:string|null };
}

export async function createGestorProPix(requestId: string) {
  if (!supabase) throw new Error('Backend indisponível.');
  const { data, error } = await supabase.functions.invoke('create-woovi-charge', { body: { mode: 'GESTOR_PRO', requestId } });
  if (error) throw error;
  if (!data?.ok) throw new Error(data?.error || 'Não foi possível gerar o Pix do Gestor Pro.');
  return data.payment as { correlationID:string; brCode?:string|null; qrCodeImage?:string|null; paymentLinkUrl?:string|null };
}

export async function loadChargePaymentData(chargeId: string) {
  if (!supabase) return null;
  const { data, error } = await supabase.from('lodge_charges')
    .select('id,status,provider,provider_reference,correlation_id,pix_copy_paste,qr_code_image_url,payment_link_url,paid_at')
    .eq('id', chargeId).single();
  if (error) throw error;
  return data;
}
