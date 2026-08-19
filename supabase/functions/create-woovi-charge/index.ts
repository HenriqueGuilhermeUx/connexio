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
    const mode = body?.mode as 'LODGE_CHARGE' | 'GESTOR_PRO';

    if (mode === 'LODGE_CHARGE') {
      const chargeId = String(body?.chargeId ?? '');
      if (!chargeId) throw new Error('Cobrança não informada.');

      const { data: charge, error: chargeError } = await admin
        .from('lodge_charges')
        .select('id,lodge_id,member_name,member_email,member_phone,description,amount_cents,due_date,status,correlation_id')
        .eq('id', chargeId)
        .single();
      if (chargeError || !charge) throw new Error('Cobrança não encontrada.');

      const { data: allowed, error: allowedError } = await userClient.rpc('can_use_lodge_pro', { target_lodge: charge.lodge_id });
      if (allowedError || !allowed) throw new Error('Gestor Pro necessário para gerar Pix.');

      const { data: integration, error: integrationError } = await admin
        .from('lodge_payment_integrations')
        .select('app_id_secret,active')
        .eq('lodge_id', charge.lodge_id)
        .eq('active', true)
        .maybeSingle();
      if (integrationError) throw integrationError;
      if (!integration?.app_id_secret) throw new Error('Configure a conta Woovi da Loja antes de gerar Pix.');

      if (charge.status === 'PAID') throw new Error('Esta cobrança já está paga.');
      const correlationID = charge.correlation_id || crypto.randomUUID();
      const woovi = await createWooviCharge(integration.app_id_secret, {
        value: Number(charge.amount_cents),
        correlationID,
        comment: charge.description,
        customer: cleanCustomer({ name: charge.member_name, email: charge.member_email, phone: charge.member_phone }),
      });

      const c = woovi.charge ?? woovi;
      const { error: updateError } = await admin.from('lodge_charges').update({
        provider: 'WOOVI',
        provider_reference: c.identifier ?? c.globalID ?? c.paymentLinkID ?? null,
        correlation_id: correlationID,
        pix_copy_paste: c.brCode ?? woovi.brCode ?? null,
        qr_code_image_url: c.qrCodeImage ?? null,
        payment_link_url: c.paymentLinkUrl ?? null,
        status: 'PENDING',
      }).eq('id', charge.id);
      if (updateError) throw updateError;

      return json({ ok: true, charge: { id: charge.id, correlationID, brCode: c.brCode ?? woovi.brCode ?? null, qrCodeImage: c.qrCodeImage ?? null, paymentLinkUrl: c.paymentLinkUrl ?? null } });
    }

    if (mode === 'GESTOR_PRO') {
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
        customer: cleanCustomer({ name: auth.user.user_metadata?.full_name, email: auth.user.email, phone: auth.user.user_metadata?.phone }),
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
    }

    throw new Error('Modo de cobrança inválido.');
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
