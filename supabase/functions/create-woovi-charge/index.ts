import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Sessão necessária.');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: auth, error: authError } = await userClient.auth.getUser();
    if (authError || !auth.user) throw new Error('Sessão inválida.');

    const body = await req.json();
    if (body?.mode !== 'GESTOR_PRO') throw new Error('Esta função gera apenas o pagamento do Connexio Gestor Pro.');

    const requestId = String(body?.requestId ?? '');
    if (!requestId) throw new Error('Solicitação Pro não informada.');

    const { data: proRequest, error: requestError } = await admin
      .from('lodge_plan_requests')
      .select('id,lodge_id,requested_by,status,payment_status,payment_correlation_id')
      .eq('id', requestId)
      .single();
    if (requestError || !proRequest) throw new Error('Solicitação Pro não encontrada.');

    if (proRequest.requested_by !== auth.user.id) {
      const { data: canManage } = await userClient.rpc('can_manage_lodge', { target_lodge: proRequest.lodge_id });
      if (!canManage) throw new Error('Sem permissão para esta Loja.');
    }

    const appId = Deno.env.get('WOOVI_CONNEXIO_APP_ID');
    if (!appId) throw new Error('Woovi do Connexio ainda não foi configurada no servidor.');

    const correlationID = proRequest.payment_correlation_id || crypto.randomUUID();
    const woovi = await createWooviCharge(appId, {
      value: 4990,
      correlationID,
      comment: 'Connexio Gestor Pro - 1 mês',
      customer: cleanCustomer({
        name: auth.user.user_metadata?.full_name,
        email: auth.user.email,
        phone: auth.user.user_metadata?.phone,
      }),
    });
    const c = woovi.charge ?? woovi;

    const { error: updateError } = await admin.from('lodge_plan_requests').update({
      payment_provider: 'WOOVI',
      payment_correlation_id: correlationID,
      payment_reference: c.identifier ?? c.globalID ?? c.paymentLinkID ?? null,
      pix_copy_paste: c.brCode ?? woovi.brCode ?? null,
      payment_link_url: c.paymentLinkUrl ?? null,
      payment_status: 'PENDING',
    }).eq('id', requestId);
    if (updateError) throw updateError;

    return json({ ok: true, payment: { correlationID, brCode: c.brCode ?? woovi.brCode ?? null, qrCodeImage: c.qrCodeImage ?? null, paymentLinkUrl: c.paymentLinkUrl ?? null } });
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : String(error) }, 400);
  }
});

async function createWooviCharge(appId: string, payload: Record<string, unknown>) {
  const response = await fetch('https://api.woovi.com/api/v1/charge', {
    method: 'POST',
    headers: { Authorization: appId, Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message ?? data?.message ?? `Woovi retornou HTTP ${response.status}`);
  return data;
}

function cleanCustomer(customer: { name?: string | null; email?: string | null; phone?: string | null }) {
  const value: Record<string, string> = {};
  if (customer.name) value.name = customer.name;
  if (customer.email) value.email = customer.email;
  if (customer.phone) value.phone = customer.phone.replace(/\D/g, '');
  return Object.keys(value).length ? value : undefined;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
