begin;

-- O cadastro do Auth cria perfil e solicitação de validação na mesma operação.
-- O CIM chega somente pelos metadados do cadastro e é persistido na tabela privada.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  normalized_cim text;
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = excluded.full_name,
      phone = excluded.phone;

  normalized_cim := regexp_replace(coalesce(new.raw_user_meta_data ->> 'cim', ''), '[^0-9]', '', 'g');

  if char_length(normalized_cim) >= 4 then
    insert into public.member_verifications (user_id, cim_number, cim_last4)
    values (new.id, normalized_cim, right(normalized_cim, 4))
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

-- O membro pendente pode preencher a oferta completa. A proteção acontece pela
-- visibilidade e pelos estados, não pela perda dos dados informados no onboarding.
create or replace function public.apply_listing_submission_rules()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if current_user in ('postgres', 'service_role') or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.owner_id = auth.uid();
    new.is_preview = false;
    new.published_at = null;
  else
    new.owner_id = old.owner_id;
    new.is_preview = old.is_preview;
    new.published_at = old.published_at;
  end if;

  if public.is_approved_member() then
    new.status = 'PENDING_REVIEW';
  else
    new.status = 'PENDING_MEMBER_APPROVAL';
    new.is_preview = false;
    new.published_at = null;
  end if;

  return new;
end;
$$;

-- O proprietário pode registrar e manter os próprios meios de contato mesmo
-- pendente. Esses dados continuam invisíveis para terceiros até a aprovação.
drop policy if exists listing_contacts_insert on public.listing_contacts;
create policy listing_contacts_insert
on public.listing_contacts for insert
to authenticated
with check (
  public.is_admin()
  or exists (
    select 1
    from public.listings l
    where l.id = listing_contacts.listing_id
      and l.owner_id = (select auth.uid())
  )
);

drop policy if exists listing_contacts_update on public.listing_contacts;
create policy listing_contacts_update
on public.listing_contacts for update
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.listings l
    where l.id = listing_contacts.listing_id
      and l.owner_id = (select auth.uid())
  )
)
with check (
  public.is_admin()
  or exists (
    select 1
    from public.listings l
    where l.id = listing_contacts.listing_id
      and l.owner_id = (select auth.uid())
  )
);

-- Segmentos iniciais ampliados. A tabela continua administrável para expansão.
insert into public.categories (slug, name, position) values
  ('administracao', 'Administração e Gestão', 100),
  ('agro', 'Agronegócio', 110),
  ('arquitetura', 'Arquitetura e Urbanismo', 120),
  ('artes', 'Artes, Cultura e Entretenimento', 130),
  ('beleza', 'Beleza e Bem-estar', 140),
  ('comercio', 'Comércio e Varejo', 150),
  ('comunicacao', 'Comunicação e Marketing', 160),
  ('construcao', 'Construção e Reformas', 170),
  ('consultoria', 'Consultoria', 180),
  ('educacao', 'Educação e Treinamentos', 190),
  ('energia', 'Energia e Sustentabilidade', 200),
  ('eventos', 'Eventos', 210),
  ('financas', 'Finanças e Investimentos', 220),
  ('fotografia', 'Fotografia e Audiovisual', 230),
  ('industria', 'Indústria', 240),
  ('logistica', 'Logística e Transporte', 250),
  ('manutencao', 'Manutenção e Assistência Técnica', 260),
  ('moda', 'Moda e Acessórios', 270),
  ('pet', 'Produtos e Serviços para Pets', 280),
  ('recursos-humanos', 'Recursos Humanos', 290),
  ('seguros', 'Seguros', 300),
  ('servicos-domesticos', 'Serviços para Casa', 310),
  ('telecom', 'Telecomunicações', 320),
  ('outros', 'Outros', 999)
on conflict (slug) do update
set name = excluded.name,
    position = excluded.position,
    active = true;

-- Fila auditável para avisos administrativos. O envio será realizado por uma
-- Edge Function, sem expor credenciais de e-mail no aplicativo.
create table if not exists public.admin_notification_outbox (
  id bigint generated always as identity primary key,
  event_type text not null check (event_type in ('NEW_MEMBER', 'MEMBER_APPROVED', 'NEW_LISTING')),
  entity_id uuid not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'PENDING' check (status in ('PENDING', 'SENT', 'FAILED')),
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  unique (event_type, entity_id)
);

alter table public.admin_notification_outbox enable row level security;

drop policy if exists admin_notification_outbox_admin_select on public.admin_notification_outbox;
create policy admin_notification_outbox_admin_select
on public.admin_notification_outbox for select
to authenticated
using (public.is_admin());

create or replace function public.enqueue_new_member_notification()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  profile_record public.profiles%rowtype;
begin
  select * into profile_record
  from public.profiles
  where id = new.user_id;

  insert into public.admin_notification_outbox (
    event_type,
    entity_id,
    payload
  ) values (
    'NEW_MEMBER',
    new.user_id,
    jsonb_build_object(
      'full_name', profile_record.full_name,
      'email', profile_record.email,
      'phone', profile_record.phone,
      'cim_last4', new.cim_last4,
      'submitted_at', new.submitted_at
    )
  )
  on conflict (event_type, entity_id) do nothing;

  return new;
end;
$$;

drop trigger if exists member_verification_enqueue_notification on public.member_verifications;
create trigger member_verification_enqueue_notification
after insert on public.member_verifications
for each row execute function public.enqueue_new_member_notification();

grant select on public.admin_notification_outbox to authenticated;

commit;
