begin;

create table if not exists public.lodge_payment_integrations (
  lodge_id uuid primary key references public.lodges(id) on delete cascade,
  provider text not null default 'WOOVI' check (provider='WOOVI'),
  app_id_secret text not null,
  active boolean not null default true,
  configured_by uuid not null references auth.users(id),
  configured_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lodge_payment_integrations enable row level security;

-- O segredo nunca é selecionável pelo cliente. Configuração ocorre somente por RPC.
revoke all on public.lodge_payment_integrations from anon, authenticated;

create or replace function public.configure_lodge_woovi(target_lodge uuid, target_app_id text)
returns void
language plpgsql
security definer
set search_path=public,pg_temp
as $$
begin
  if not public.can_use_lodge_pro(target_lodge) then raise exception 'Gestor Pro necessário'; end if;
  if target_app_id is null or length(trim(target_app_id)) < 10 then raise exception 'AppID Woovi inválido'; end if;
  insert into public.lodge_payment_integrations(lodge_id,provider,app_id_secret,active,configured_by)
  values(target_lodge,'WOOVI',trim(target_app_id),true,auth.uid())
  on conflict(lodge_id) do update set app_id_secret=excluded.app_id_secret,active=true,configured_by=auth.uid(),updated_at=now();
end;$$;

grant execute on function public.configure_lodge_woovi(uuid,text) to authenticated;

create or replace function public.disable_lodge_woovi(target_lodge uuid)
returns void
language plpgsql
security definer
set search_path=public,pg_temp
as $$
begin
  if not public.can_use_lodge_pro(target_lodge) then raise exception 'Gestor Pro necessário'; end if;
  update public.lodge_payment_integrations set active=false,updated_at=now() where lodge_id=target_lodge;
end;$$;

grant execute on function public.disable_lodge_woovi(uuid) to authenticated;

create or replace function public.lodge_woovi_configured(target_lodge uuid)
returns boolean
language sql
stable
security definer
set search_path=public,pg_temp
as $$
  select public.can_manage_lodge(target_lodge) and exists(
    select 1 from public.lodge_payment_integrations i where i.lodge_id=target_lodge and i.active
  );
$$;

grant execute on function public.lodge_woovi_configured(uuid) to authenticated;

commit;
