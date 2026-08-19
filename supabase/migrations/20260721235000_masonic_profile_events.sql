begin;

alter table public.profiles
  add column if not exists lodge_name text,
  add column if not exists lodge_number text,
  add column if not exists obedience text,
  add column if not exists event_email_opt_in boolean not null default false;

do $$
begin
  create type public.event_status as enum ('PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'CANCELLED');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.event_scope as enum ('CITY', 'REGION', 'STATE', 'NETWORK');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  organizer_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 4 and 140),
  description text not null check (char_length(description) between 10 and 2000),
  starts_at timestamptz not null,
  ends_at timestamptz,
  venue text not null,
  address text,
  city text not null,
  region text not null,
  lodge_name text not null,
  contact_whatsapp text not null,
  ticket_price numeric(12,2),
  ticket_url text,
  audience_scope public.event_scope not null default 'REGION',
  image_path text,
  status public.event_status not null default 'PENDING_REVIEW',
  featured boolean not null default false,
  published_at timestamptz,
  email_sent_at timestamptz,
  review_reason text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_end_after_start check (ends_at is null or ends_at > starts_at)
);

create index if not exists events_status_date_idx on public.events(status, starts_at);
create index if not exists events_region_date_idx on public.events(region, city, starts_at);
create index if not exists events_organizer_idx on public.events(organizer_id, created_at desc);

create table if not exists public.event_email_deliveries (
  id bigint generated always as identity primary key,
  event_id uuid not null references public.events(id) on delete cascade,
  recipient_id uuid references public.profiles(id) on delete set null,
  recipient_email text not null,
  status text not null check (status in ('SENT', 'FAILED', 'SKIPPED')),
  provider_id text,
  error_message text,
  created_at timestamptz not null default now(),
  unique (event_id, recipient_email)
);

alter table public.events enable row level security;
alter table public.event_email_deliveries enable row level security;

drop policy if exists events_select on public.events;
create policy events_select
on public.events for select
to authenticated
using (
  organizer_id = (select auth.uid())
  or public.is_admin()
  or status = 'PUBLISHED'
);

drop policy if exists events_insert_approved on public.events;
create policy events_insert_approved
on public.events for insert
to authenticated
with check (
  organizer_id = (select auth.uid())
  and public.is_approved_member()
);

drop policy if exists events_update_own on public.events;
create policy events_update_own
on public.events for update
to authenticated
using (organizer_id = (select auth.uid()) or public.is_admin())
with check (organizer_id = (select auth.uid()) or public.is_admin());

drop policy if exists events_delete_own_unpublished on public.events;
create policy events_delete_own_unpublished
on public.events for delete
to authenticated
using (
  public.is_admin()
  or (organizer_id = (select auth.uid()) and status <> 'PUBLISHED')
);

drop policy if exists event_email_deliveries_admin on public.event_email_deliveries;
create policy event_email_deliveries_admin
on public.event_email_deliveries for select
to authenticated
using (public.is_admin());

create or replace function public.apply_event_submission_rules()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if current_user in ('postgres', 'service_role') or public.is_admin() then
    return new;
  end if;

  new.organizer_id = auth.uid();
  new.status = 'PENDING_REVIEW';
  new.featured = false;
  new.published_at = null;
  new.email_sent_at = null;
  new.review_reason = null;
  new.reviewed_by = null;
  new.reviewed_at = null;
  return new;
end;
$$;

drop trigger if exists events_apply_submission_rules on public.events;
create trigger events_apply_submission_rules
before insert or update on public.events
for each row execute function public.apply_event_submission_rules();

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
before update on public.events
for each row execute function public.set_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-images',
  'event-images',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists event_images_storage_select on storage.objects;
create policy event_images_storage_select
on storage.objects for select
to authenticated
using (
  bucket_id = 'event-images'
  and (
    public.is_admin()
    or exists (
      select 1 from public.events e
      where e.image_path = name
        and (e.organizer_id = (select auth.uid()) or e.status = 'PUBLISHED')
    )
  )
);

drop policy if exists event_images_storage_insert on storage.objects;
create policy event_images_storage_insert
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'event-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and public.is_approved_member()
);

drop policy if exists event_images_storage_update on storage.objects;
create policy event_images_storage_update
on storage.objects for update
to authenticated
using (
  bucket_id = 'event-images'
  and (public.is_admin() or (storage.foldername(name))[1] = (select auth.uid())::text)
)
with check (
  bucket_id = 'event-images'
  and (public.is_admin() or (storage.foldername(name))[1] = (select auth.uid())::text)
);

drop policy if exists event_images_storage_delete on storage.objects;
create policy event_images_storage_delete
on storage.objects for delete
to authenticated
using (
  bucket_id = 'event-images'
  and (public.is_admin() or (storage.foldername(name))[1] = (select auth.uid())::text)
);

create or replace view public.admin_event_queue
with (security_invoker = true)
as
select
  e.id,
  e.organizer_id,
  p.full_name as organizer_name,
  p.email as organizer_email,
  e.title,
  e.description,
  e.starts_at,
  e.ends_at,
  e.venue,
  e.address,
  e.city,
  e.region,
  e.lodge_name,
  e.contact_whatsapp,
  e.ticket_price,
  e.ticket_url,
  e.audience_scope,
  e.image_path,
  e.status,
  e.featured,
  e.created_at
from public.events e
join public.profiles p on p.id = e.organizer_id
where e.status = 'PENDING_REVIEW';

create or replace function public.admin_review_event(
  target_event_id uuid,
  decision public.event_status,
  review_note text default null,
  make_featured boolean default false
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception 'Acesso administrativo necessário';
  end if;

  if decision not in ('PUBLISHED', 'REJECTED', 'CANCELLED') then
    raise exception 'Decisão inválida';
  end if;

  update public.events
  set status = decision,
      featured = case when decision = 'PUBLISHED' then make_featured else false end,
      published_at = case when decision = 'PUBLISHED' then coalesce(published_at, now()) else null end,
      review_reason = nullif(trim(review_note), ''),
      reviewed_by = auth.uid(),
      reviewed_at = now()
  where id = target_event_id;

  if not found then
    raise exception 'Evento não encontrado';
  end if;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  normalized_cim text;
  terms_version_value text;
  privacy_version_value text;
begin
  insert into public.profiles (
    id, email, full_name, phone, city, region,
    lodge_name, lodge_number, obedience, event_email_opt_in
  )
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    nullif(new.raw_user_meta_data ->> 'city', ''),
    nullif(new.raw_user_meta_data ->> 'region', ''),
    nullif(new.raw_user_meta_data ->> 'lodge_name', ''),
    nullif(new.raw_user_meta_data ->> 'lodge_number', ''),
    nullif(new.raw_user_meta_data ->> 'obedience', ''),
    coalesce((new.raw_user_meta_data ->> 'event_email_opt_in')::boolean, false)
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = excluded.full_name,
      phone = excluded.phone,
      city = coalesce(excluded.city, public.profiles.city),
      region = coalesce(excluded.region, public.profiles.region),
      lodge_name = coalesce(excluded.lodge_name, public.profiles.lodge_name),
      lodge_number = coalesce(excluded.lodge_number, public.profiles.lodge_number),
      obedience = coalesce(excluded.obedience, public.profiles.obedience);

  normalized_cim := regexp_replace(coalesce(new.raw_user_meta_data ->> 'cim', ''), '[^0-9]', '', 'g');
  if char_length(normalized_cim) >= 4 then
    insert into public.member_verifications (user_id, cim_number, cim_last4)
    values (new.id, normalized_cim, right(normalized_cim, 4))
    on conflict (user_id) do nothing;
  end if;

  terms_version_value := nullif(new.raw_user_meta_data ->> 'terms_version', '');
  privacy_version_value := nullif(new.raw_user_meta_data ->> 'privacy_version', '');
  if terms_version_value is not null and privacy_version_value is not null then
    insert into public.legal_acceptances (user_id, terms_version, privacy_version)
    values (new.id, terms_version_value, privacy_version_value)
    on conflict do nothing;
  end if;

  return new;
end;
$$;

create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;

create or replace function public.invoke_notify_region_event()
returns trigger
language plpgsql
security definer
set search_path = public, vault, net, pg_temp
as $$
declare
  webhook_secret text;
begin
  if new.status <> 'PUBLISHED' or old.status = 'PUBLISHED' then
    return new;
  end if;

  select decrypted_secret into webhook_secret
  from vault.decrypted_secrets
  where name = 'connexio_webhook_secret'
  limit 1;

  if webhook_secret is null then
    raise warning 'connexio_webhook_secret não encontrado no Vault';
    return new;
  end if;

  perform net.http_post(
    url := 'https://umgryjsxpvycrrcjtglm.supabase.co/functions/v1/notify-region-event',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', webhook_secret
    ),
    body := jsonb_build_object('event_id', new.id),
    timeout_milliseconds := 5000
  );

  return new;
end;
$$;

drop trigger if exists events_notify_region on public.events;
create trigger events_notify_region
after update of status on public.events
for each row
execute function public.invoke_notify_region_event();

revoke all on function public.admin_review_event(uuid, public.event_status, text, boolean) from public;
grant execute on function public.admin_review_event(uuid, public.event_status, text, boolean) to authenticated;
grant select, insert, update, delete on public.events to authenticated;
grant select on public.admin_event_queue to authenticated;
grant select on public.event_email_deliveries to authenticated;

commit;
