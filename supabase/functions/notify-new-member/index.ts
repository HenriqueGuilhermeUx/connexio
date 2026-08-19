import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

type OutboxRecord = {
  id: number;
  event_type: 'NEW_MEMBER' | 'MEMBER_APPROVED' | 'NEW_LISTING';
  entity_id: string;
  payload: {
    full_name?: string;
    email?: string;
    phone?: string;
    cim_last4?: string;
    submitted_at?: string;
  };
  status: 'PENDING' | 'SENT' | 'FAILED';
};

type WebhookPayload = {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: OutboxRecord | null;
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const expectedSecret = Deno.env.get('CONNEXIO_WEBHOOK_SECRET');
  const receivedSecret = request.headers.get('x-webhook-secret');

  if (!expectedSecret || receivedSecret !== expectedSecret) {
    return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const adminEmail = Deno.env.get('ADMIN_NOTIFICATION_EMAIL');
  const mailFrom = Deno.env.get('MAIL_FROM') ?? 'Connexio <onboarding@resend.dev>';

  if (!supabaseUrl || !serviceRoleKey || !resendApiKey || !adminEmail) {
    return Response.json({ error: 'Missing function secrets' }, { status: 500, headers: corsHeaders });
  }

  const payload = await request.json() as WebhookPayload;
  const record = payload.record;

  if (
    payload.type !== 'INSERT' ||
    payload.table !== 'admin_notification_outbox' ||
    !record ||
    record.event_type !== 'NEW_MEMBER' ||
    record.status !== 'PENDING'
  ) {
    return Response.json({ ignored: true }, { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const member = record.payload;
  const submittedAt = member.submitted_at
    ? new Date(member.submitted_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    : 'agora';

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Connexio/1.0',
        'Idempotency-Key': `connexio-new-member-${record.entity_id}`,
      },
      body: JSON.stringify({
        from: mailFrom,
        to: [adminEmail],
        subject: `Novo cadastro aguardando aprovação: ${member.full_name ?? 'Membro Connexio'}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#111827">
            <h2 style="color:#0B132B">Novo cadastro no Connexio</h2>
            <p>Um novo membro concluiu o cadastro e aguarda sua validação manual.</p>
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb"><strong>Nome</strong></td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${member.full_name ?? 'Não informado'}</td></tr>
              <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb"><strong>E-mail</strong></td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${member.email ?? 'Não informado'}</td></tr>
              <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb"><strong>Telefone</strong></td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${member.phone ?? 'Não informado'}</td></tr>
              <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb"><strong>CIM final</strong></td><td style="padding:8px;border-bottom:1px solid #e5e7eb">•••• ${member.cim_last4 ?? '—'}</td></tr>
              <tr><td style="padding:8px"><strong>Enviado em</strong></td><td style="padding:8px">${submittedAt}</td></tr>
            </table>
            <p style="margin-top:24px">Acesse o painel administrativo do Connexio para analisar a solicitação.</p>
            <p style="font-size:12px;color:#6b7280">Desenvolvido por Alternative Ventures · CNPJ 61.920.356/0001-38</p>
          </div>
        `,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(JSON.stringify(result));
    }

    await supabase
      .from('admin_notification_outbox')
      .update({ status: 'SENT', sent_at: new Date().toISOString(), attempts: record.id ? 1 : 1, last_error: null })
      .eq('id', record.id);

    return Response.json({ sent: true, id: result.id }, { headers: corsHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    await supabase
      .from('admin_notification_outbox')
      .update({ status: 'FAILED', attempts: 1, last_error: message })
      .eq('id', record.id);

    return Response.json({ error: message }, { status: 500, headers: corsHeaders });
  }
});
