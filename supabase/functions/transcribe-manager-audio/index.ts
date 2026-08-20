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

    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) return json({ error: 'openai_not_configured', message: 'Configure OPENAI_API_KEY no Supabase.' }, 503);

    const bytes = await req.arrayBuffer();
    if (!bytes.byteLength) return json({ error: 'empty_audio' }, 400);
    if (bytes.byteLength > 25 * 1024 * 1024) return json({ error: 'audio_too_large' }, 413);

    const contentType = req.headers.get('content-type') || 'audio/mp4';
    const purpose = req.headers.get('x-audio-purpose') || 'COMMAND';
    const languageHeader = req.headers.get('x-audio-language') || 'pt-BR';
    const language = languageHeader.toLowerCase().startsWith('pt') ? 'pt' : languageHeader.split('-')[0];
    const name = safeName(req.headers.get('x-audio-name') || 'audio.m4a');

    const form = new FormData();
    form.append('file', new File([bytes], name, { type: contentType }));
    form.append('model', Deno.env.get('OPENAI_TRANSCRIBE_MODEL') || 'gpt-4o-mini-transcribe');
    form.append('language', language);
    form.append('response_format', 'json');
    form.append('prompt', purpose === 'MINUTES'
      ? 'Transcreva em português do Brasil. Contexto: ata de reunião de uma Loja maçônica. Preserve nomes próprios, cargos, datas, valores, deliberações, votações, responsáveis e prazos. Não resuma e não invente informações.'
      : 'Transcreva em português do Brasil um comando administrativo. Preserve nomes, datas, valores, vencimentos e instruções exatamente como falados.');

    const upstream = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    });

    const raw = await upstream.text();
    if (!upstream.ok) {
      console.error('OpenAI transcription failed', upstream.status, raw.slice(0, 1500));
      return json({ error: 'transcription_failed', upstream_status: upstream.status, message: safeUpstreamMessage(raw) }, 502);
    }

    let payload: any = null;
    try { payload = raw ? JSON.parse(raw) : null; } catch { payload = { text: raw }; }
    const text = String(payload?.text ?? payload?.transcript ?? '').trim();
    if (!text) return json({ error: 'empty_transcription' }, 502);

    return json({
      text,
      purpose,
      provider: 'OPENAI',
      model: Deno.env.get('OPENAI_TRANSCRIBE_MODEL') || 'gpt-4o-mini-transcribe',
    }, 200);
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

function safeUpstreamMessage(raw: string) {
  try {
    const parsed = JSON.parse(raw);
    return String(parsed?.error?.message ?? parsed?.message ?? '').slice(0, 500) || undefined;
  } catch {
    return raw.slice(0, 500) || undefined;
  }
}
