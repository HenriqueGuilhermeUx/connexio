begin;

create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;

-- Troque o valor abaixo pela MESMA senha usada no Secret
-- CONNEXIO_WEBHOOK_SECRET da Edge Function antes de executar.
do $$
declare
  secret_id uuid;
  secret_value text := 'SUBSTITUA_PELA_MESMA_SENHA_DO_WEBHOOK';
begin
  if secret_value = 'SUBSTITUA_PELA_MESMA_SENHA_DO_WEBHOOK' then
    raise exception 'Substitua a senha do webhook antes de executar.';
  end if;

  select id into secret_id
  from vault.secrets
  where name = 'connexio_webhook_secret'
  limit 1;

  if secret_id is null then
    perform vault.create_secret(
      secret_value,
      'connexio_webhook_secret',
      'Segredo usado pelo gatilho de notificação do Connexio'
    );
  else
    perform vault.update_secret(
      secret_id,
      secret_value,
      'connexio_webhook_secret',
      'Segredo usado pelo gatilho de notificação do Connexio'
    );
  end if;
end;
$$;

create or replace function public.invoke_notify_new_member()
returns trigger
language plpgsql
security definer
set search_path = public, vault, net, pg_temp
as $$
declare
  webhook_secret text;
begin
  select decrypted_secret into webhook_secret
  from vault.decrypted_secrets
  where name = 'connexio_webhook_secret'
  limit 1;

  if webhook_secret is null then
    raise warning 'connexio_webhook_secret não encontrado no Vault';
    return new;
  end if;

  perform net.http_post(
    url := 'https://umgryjsxpvycrrcjtglm.supabase.co/functions/v1/notify-new-member',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', webhook_secret
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'admin_notification_outbox',
      'schema', 'public',
      'record', to_jsonb(new),
      'old_record', null
    ),
    timeout_milliseconds := 5000
  );

  return new;
end;
$$;

drop trigger if exists admin_notification_outbox_notify on public.admin_notification_outbox;
create trigger admin_notification_outbox_notify
after insert on public.admin_notification_outbox
for each row
execute function public.invoke_notify_new_member();

commit;
