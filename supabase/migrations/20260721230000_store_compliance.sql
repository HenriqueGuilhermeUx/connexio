begin;

create type public.report_status as enum ('OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED');

create table public.legal_acceptances (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  terms_version text not null,
  privacy_version text not null,
  accepted_at timestamptz not null default now(),
  unique (user_id, terms_version, privacy_version)
);

create table public.listing_reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reason text not null check (reason in ('INAPPROPRIATE', 'MISLEADING', 'FRAUD', 'DUPLICATE', 'OTHER')),
  details text check (details is null or char_length(details) <= 1000),
  status public.report_status not null default 'OPEN',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  resolution_note text,
  created_at timestamptz not null default now(),
  unique (listing_id, reporter_id)
);

create index listing_reports_status_idx on public.listing_reports(status, created_at);
create index listing_reports_listing_idx on public.listing_reports(listing_id);

alter table public.legal_acceptances enable row level security;
alter table public.listing_reports enable row level security;

create policy legal_acceptances_select_own
on public.legal_acceptances for select
to authenticated
using (user_id = (select auth.uid()) or public.is_admin());

create policy listing_reports_insert_own
on public.listing_reports for insert
to authenticated
with check (
  reporter_id = (select auth.uid())
  and exists (
    select 1 from public.listings l
    where l.id = listing_reports.listing_id
      and l.status = 'PUBLISHED'
      and l.owner_id <> (select auth.uid())
  )
);

create policy listing_reports_select_own
on public.listing_reports for select
to authenticated
using (reporter_id = (select auth.uid()) or public.is_admin());

create policy listing_reports_admin_all
on public.listing_reports for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

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

create or replace function public.admin_review_report(
  target_report_id uuid,
  decision public.report_status,
  review_note text default null
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

  if decision not in ('REVIEWING', 'RESOLVED', 'DISMISSED') then
    raise exception 'Decisão inválida';
  end if;

  update public.listing_reports
  set status = decision,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      resolution_note = review_note
  where id = target_report_id;

  if not found then
    raise exception 'Denúncia não encontrada';
  end if;
end;
$$;

create or replace view public.admin_report_queue
with (security_invoker = true)
as
select
  r.id,
  r.listing_id,
  l.title as listing_title,
  l.owner_id,
  owner.full_name as owner_name,
  r.reporter_id,
  reporter.full_name as reporter_name,
  reporter.email as reporter_email,
  r.reason,
  r.details,
  r.status,
  r.created_at
from public.listing_reports r
join public.listings l on l.id = r.listing_id
join public.profiles owner on owner.id = l.owner_id
join public.profiles reporter on reporter.id = r.reporter_id;

create or replace function public.cleanup_profile_storage()
returns trigger
language plpgsql
security definer
set search_path = public, storage, pg_temp
as $$
begin
  delete from storage.objects
  where bucket_id = 'listing-images'
    and name like old.id::text || '/%';
  return old;
end;
$$;

create trigger profiles_cleanup_storage
before delete on public.profiles
for each row execute function public.cleanup_profile_storage();

create or replace function public.delete_my_account(confirm_email text)
returns void
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text;
begin
  if current_user_id is null then
    raise exception 'Sessão necessária';
  end if;

  select lower(email) into current_email
  from auth.users
  where id = current_user_id;

  if current_email is null or current_email <> lower(trim(confirm_email)) then
    raise exception 'Confirmação de e-mail inválida';
  end if;

  delete from auth.users where id = current_user_id;
end;
$$;

revoke all on function public.admin_review_report(uuid, public.report_status, text) from public;
revoke all on function public.delete_my_account(text) from public;
grant execute on function public.admin_review_report(uuid, public.report_status, text) to authenticated;
grant execute on function public.delete_my_account(text) to authenticated;

grant select on public.legal_acceptances to authenticated;
grant select, insert, update on public.listing_reports to authenticated;
grant select on public.admin_report_queue to authenticated;

commit;
