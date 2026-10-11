import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization) throw new Error('Autenticação necessária');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
    const service = createClient(supabaseUrl, serviceKey);
    const { announcement_id } = await req.json();
    if (!announcement_id) throw new Error('announcement_id obrigatório');

    const { data: announcement, error: announcementError } = await userClient
      .from('lodge_announcements')
      .select('id,lodge_id,title,message,push_requested')
      .eq('id', announcement_id)
      .single();
    if (announcementError) throw announcementError;
    if (!announcement.push_requested) return json({ sent: 0, skipped: true });

    const { data: canManage, error: permissionError } = await userClient.rpc('can_manage_lodge', { target_lodge: announcement.lodge_id });
    if (permissionError) throw permissionError;
    if (!canManage) return json({ error: 'Acesso de gestão necessário' }, 403);

    const { data: memberships, error: memberError } = await service
      .from('lodge_memberships')
      .select('member_id')
      .eq('lodge_id', announcement.lodge_id)
      .eq('status', 'ACTIVE');
    if (memberError) throw memberError;
    const memberIds = (memberships ?? []).map((row) => row.member_id);
    if (!memberIds.length) return json({ sent: 0 });

    const { data: tokens, error: tokenError } = await service
      .from('device_push_tokens')
      .select('expo_push_token')
      .in('user_id', memberIds)
      .eq('enabled', true);
    if (tokenError) throw tokenError;

    const messages = (tokens ?? []).map((row) => ({
      to: row.expo_push_token,
      title: announcement.title,
      body: announcement.message,
      sound: 'default',
      channelId: 'connexio-loja',
      data: { url: '/manager-communications', lodgeId: announcement.lodge_id },
    }));
    if (!messages.length) return json({ sent: 0 });

    let sent = 0;
    for (let index = 0; index < messages.length; index += 100) {
      const batch = messages.slice(index, index + 100);
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(batch),
      });
      if (!response.ok) throw new Error(`Expo Push respondeu ${response.status}`);
      sent += batch.length;
    }

    return json({ sent });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Falha ao enviar push' }, 400);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
