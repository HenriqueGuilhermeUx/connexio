import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
};

const escapeHtml = (value: string | null | undefined) =>
  (value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

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
  const mailFrom = Deno.env.get('MAIL_FROM') ?? 'Connexio <onboarding@resend.dev>';

  if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
    return Response.json({ error: 'Missing function secrets' }, { status: 500, headers: corsHeaders });
  }

  const { event_id: eventId } = await request.json() as { event_id?: string };
  if (!eventId) {
    return Response.json({ error: 'event_id is required' }, { status: 400, headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id,title,description,starts_at,venue,address,city,region,lodge_name,ticket_price,ticket_url,audience_scope,status,email_sent_at,organizer_id')
    .eq('id', eventId)
    .single();

  if (eventError || !event) {
    return Response.json({ error: eventError?.message ?? 'Event not found' }, { status: 404, headers: corsHeaders });
  }

  if (event.status !== 'PUBLISHED' || event.email_sent_at) {
    return Response.json({ ignored: true }, { headers: corsHeaders });
  }

  let recipientsQuery = supabase
    .from('profiles')
    .select('id,email,full_name,city,region')
    .eq('status', 'APPROVED')
    .eq('event_email_opt_in', true)
    .neq('email', '')
    .neq('id', event.organizer_id);

  if (event.audience_scope === 'CITY') {
    recipientsQuery = recipientsQuery.eq('city', event.city).eq('region', event.region);
  } else if (event.audience_scope === 'REGION' || event.audience_scope === 'STATE') {
    recipientsQuery = recipientsQuery.eq('region', event.region);
  }

  const { data: recipients, error: recipientsError } = await recipientsQuery;
  if (recipientsError) {
    return Response.json({ error: recipientsError.message }, { status: 500, headers: corsHeaders });
  }

  const startsAt = new Date(event.starts_at).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'long',
    timeStyle: 'short',
  });
  const appUrl = 'https://henriqueguilhermeux.github.io/connexio/events';
  let sent = 0;
  let failed = 0;

  for (const recipient of recipients ?? []) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Connexio/1.0',
          'Idempotency-Key': `connexio-event-${event.id}-${recipient.id}`,
        },
        body: JSON.stringify({
          from: mailFrom,
          to: [recipient.email],
          subject: `Novo evento na sua região: ${event.title}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#111827">
              <p>Olá, ${escapeHtml(recipient.full_name?.split(' ')[0] || 'irmão')}.</p>
              <h2 style="color:#0B132B">${escapeHtml(event.title)}</h2>
              <p>${escapeHtml(event.description)}</p>
              <table style="width:100%;border-collapse:collapse">
                <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb"><strong>Data</strong></td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${escapeHtml(startsAt)}</td></tr>
                <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb"><strong>Local</strong></td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${escapeHtml(event.venue)}</td></tr>
                <tr><td style="padding:8px;border-bottom:1px solid #e5e7eb"><strong>Cidade</strong></td><td style="padding:8px;border-bottom:1px solid #e5e7eb">${escapeHtml(event.city)} · ${escapeHtml(event.region)}</td></tr>
                <tr><td style="padding:8px"><strong>Organização</strong></td><td style="padding:8px">${escapeHtml(event.lodge_name)}</td></tr>
              </table>
              <p style="margin:24px 0"><a href="${appUrl}" style="background:#C8A96B;color:#081526;padding:12px 18px;text-decoration:none;border-radius:10px;font-weight:bold">Ver evento no Connexio</a></p>
              <p style="font-size:12px;color:#6b7280">Você recebeu esta mensagem porque ativou eventos por e-mail no Connexio. A preferência pode ser alterada em Perfil → Dados maçônicos e eventos.</p>
              <p style="font-size:12px;color:#6b7280">Alternative Ventures · CNPJ 61.920.356/0001-38</p>
            </div>
          `,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(JSON.stringify(result));

      await supabase.from('event_email_deliveries').upsert({
        event_id: event.id,
        recipient_id: recipient.id,
        recipient_email: recipient.email,
        status: 'SENT',
        provider_id: result.id ?? null,
        error_message: null,
      }, { onConflict: 'event_id,recipient_email' });
      sent += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      await supabase.from('event_email_deliveries').upsert({
        event_id: event.id,
        recipient_id: recipient.id,
        recipient_email: recipient.email,
        status: 'FAILED',
        provider_id: null,
        error_message: message.slice(0, 1000),
      }, { onConflict: 'event_id,recipient_email' });
      failed += 1;
    }
  }

  await supabase
    .from('events')
    .update({ email_sent_at: new Date().toISOString() })
    .eq('id', event.id);

  return Response.json({ sent, failed, recipients: recipients?.length ?? 0 }, { headers: corsHeaders });
});
