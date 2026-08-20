import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  // Woovi validates the endpoint before allowing webhook registration.
  // Health-checks must return HTTP 200 without touching payment state.
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return new Response('ok', { status: 200 });
  }

  try {
    const rawBody = await req.text();

    // Some provider validation probes arrive as an empty POST.
    // It is safe to acknowledge them because there is no event to process.
    if (!rawBody.trim()) return new Response('ok', { status: 200 });

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      // Non-JSON validation probes are acknowledged without processing.
      return new Response('ok', { status: 200 });
    }

    const expected = Deno.env.get('WOOVI_WEBHOOK_AUTH');
    const received = req.headers.get('authorization') ?? req.headers.get('Authorization');
    if (expected && received !== expected) return new Response('unauthorized', { status: 401 });

    const charge = payload?.charge ?? payload?.data?.charge ?? payload;
    const correlationID = charge?.correlationID ?? payload?.correlationID;
    const status = String(charge?.status ?? '').toUpperCase();

    // A JSON validation payload without a real charge is also harmless.
    if (!correlationID) return new Response('ok', { status: 200 });

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const completed = status === 'COMPLETED' || status === 'PAID';
    const expired = status === 'EXPIRED';

    const { data: proRequest } = await admin
      .from('lodge_plan_requests')
      .select('id,lodge_id,status,payment_status')
      .eq('payment_correlation_id', correlationID)
      .maybeSingle();

    if (proRequest) {
      if (completed) {
        const now = new Date().toISOString();
        const { error: requestError } = await admin.from('lodge_plan_requests').update({
          payment_status: 'PAID',
          status: 'APPROVED',
          decided_at: now,
          commercial_note: 'Ativação automática por pagamento Pix Woovi confirmado.',
        }).eq('id', proRequest.id);
        if (requestError) throw requestError;

        const { error: lodgeError } = await admin.from('lodges').update({ plan: 'PRO', updated_at: now }).eq('id', proRequest.lodge_id);
        if (lodgeError) throw lodgeError;

        await admin.from('lodge_audit_log').insert({
          lodge_id: proRequest.lodge_id,
          action: 'PRO_ACTIVATED_BY_WOOVI',
          entity_type: 'LODGE_PLAN_REQUEST',
          entity_id: proRequest.id,
          metadata: { correlationID, transactionID: charge?.transactionID ?? null },
        });
      } else if (expired) {
        await admin.from('lodge_plan_requests').update({ payment_status: 'EXPIRED' }).eq('id', proRequest.id);
      }
      return new Response('ok', { status: 200 });
    }

    return new Response('ignored', { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(error instanceof Error ? error.message : String(error), { status: 500 });
  }
});
