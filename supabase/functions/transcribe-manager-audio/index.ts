import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-audio-purpose, x-audio-name, x-audio-language',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader) return json({ error: 'unauthorized' }, 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user) return json({ error: 'unauthorized' }, 401);

    const staffUrl = Deno.env.get('STAFF_TRANSCRIBE_URL');
    if (!staffUrl) return json({ error: 'staff_not_configured', message: 'Configure STAFF_TRANSCRIBE_URL no Supabase.' }, 503);

    const bytes = await req.arrayBuffer();
    if (!bytes.byteLength) return json({ error: 'empty_audio' }, 400);
    if (bytes.byteLength > 25 * 1024 * 1024) return json({ error: 'audio_too_large' }, 413);

    const contentType = req.headers.get('content-type') || 'audio/mp4';
    const purpose = req.headers.get('x-audio-purpose') || 'COMMAND';
    const language = req.headers.get('x-audio-language') || 'pt-BR';
    const name = safeName(req.headers.get('x-audio-name') || 'audio.m4a');

    const form = new FormData();
    form.append('file', new File([bytes], name, { type: contentType }));
    form.append('language', language);
    form.append('purpose', purpose);
    form.append('source', 'connexio');
    form.append('user_id', auth.user.id);

    const token = Deno.env.get('STAFF_TRANSCRIBE_TOKEN');
    const upstream = await fetch(staffUrl, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
    });

    const raw = await upstream.text();
    if (!upstream.ok) {
      console.error('Staff transcription failed', upstream.status, raw.slice(0, 1000));
      return json({ error: 'transcription_failed', upstream_status: upstream.status }, 502);
    }

    let payload: any = null;
    try { payload = raw ? JSON.parse(raw) : null; } catch { payload = { text: raw }; }
    const text = String(
      payload?.text ??
      payload?.transcript ??
      payload?.data?.text ??
      payload?.data?.transcript ??
      payload?.result?.text ??
      '',
    ).trim();

    if (!text) return json({ error: 'empty_transcription' }, 502);
    return json({ text, purpose, provider: 'STAFF_WHISPER' }, 200);
  } catch (error) {
    console.error(error);
    return json({ error: 'internal_error', message: error instanceof Error ? error.message : String(error) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
}

function safeName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, '-').slice(0, 120) || 'audio.m4a';
}
