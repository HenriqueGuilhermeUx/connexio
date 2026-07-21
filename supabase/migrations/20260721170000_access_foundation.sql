begin;

create extension if not exists pgcrypto;

create type public.member_status as enum ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');
create type public.listing_type as enum ('BUSINESS', 'SERVICE', 'PRODUCT');
create type public.listing_status as enum (
  'DRAFT',
  'PENDING_MEMBER_APPROVAL',
  'PENDING_REVIEW',
  'PUBLISHED',
  'PAUSED',
  'REJECTED',
  'REMOVED'
);
create type public.price_type as enum ('FIXED', 'FROM', 'ON_REQUEST');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  full_name text not null default '',
  phone text not null default '',
  city text,
  region text,
  avatar_url text,
  status public.member_status not null default 'PENDING',
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.member_verifications (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  cim_number text not null unique,
  cim_last4 text not null,
  status public.member_status not null default 'PENDING',
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id),
  decision_reason text
);

create table public.app_admins (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.categories (
  slug text primary key,
  name text not null unique,
  position integer not null default 0,
  active boolean not null default true
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  type public.listing_type not null,
  title text not null check (char_length(title) between 3 and 120),
  description text not null check (char_length(description) between 10 and 1200),
  category_slug text not null references public.categories(slug),
  city text,
  region text,
  price numeric(12,2),
  price_type public.price_type not null default 'ON_REQUEST',
  benefit text,
  website text,
  status public.listing_status not null default 'DRAFT',
  is_preview boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table public.listing_contacts (
  listing_id uuid primary key references public.listings(id) on delete cascade,
  contact_name text,
  whatsapp text not null,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create table public.moderation_events (
  id bigint generated always as identity primary key,
  actor_id uuid not null references public.profiles(id),
  entity_type text not null check (entity_type in ('MEMBER', 'LISTING')),
  entity_id uuid not null,
  action text not null,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index profiles_status_idx on public.profiles(status);
create index member_verifications_status_idx on public.member_verifications(status);
create index listings_owner_idx on public.listings(owner_id);
create index listings_status_preview_idx on public.listings(status, is_preview);
create index listings_category_idx on public.listings(category_slug);
create index favorites_user_idx on public.favorites(user_id);
create index moderation_events_entity_idx on public.moderation_events(entity_type, entity_id);

insert into public.categories (slug, name, position) values
  ('advocacia', 'Advocacia', 10),
  ('contabilidade', 'Contabilidade', 20),
  ('engenharia', 'Engenharia', 30),
  ('imoveis', 'Imóveis', 40),
  ('saude', 'Saúde', 50),
  ('tecnologia', 'Tecnologia', 60),
  ('automotivo', 'Automotivo', 70),
  ('alimentacao', 'Alimentação', 80),
  ('turismo', 'Turismo', 90)
on conflict (slug) do nothing;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger listings_set_updated_at
before update on public.listings
for each row execute function public.set_updated_at();

create trigger listing_contacts_set_updated_at
before update on public.listing_contacts
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin(check_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.app_admins where user_id = check_user
  );
$$;

create or replace function public.is_approved_member(check_user uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles
    where id = check_user and status = 'APPROVED'
  );
$$;

create or replace function public.normalize_member_verification()
returns trigger
language plpgsql
as $$
begin
  new.cim_number = regexp_replace(new.cim_number, '[^0-9]', '', 'g');
  if char_length(new.cim_number) < 4 then
    raise exception 'CIM inválido';
  end if;
  new.cim_last4 = right(new.cim_number, 4);
  new.status = 'PENDING';
  new.reviewed_at = null;
  new.reviewed_by = null;
  new.decision_reason = null;
  return new;
end;
$$;

create trigger member_verification_normalize
before insert on public.member_verifications
for each row execute function public.normalize_member_verification();

create or replace function public.protect_profile_governance()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if current_user not in ('postgres', 'service_role') and not public.is_admin() then
    new.id = old.id;
    new.email = old.email;
    new.status = old.status;
    new.approved_at = old.approved_at;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_governance
before update on public.profiles
for each row execute function public.protect_profile_governance();

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
  else
    new.owner_id = old.owner_id;
    new.is_preview = old.is_preview;
    new.published_at = old.published_at;
  end if;

  if public.is_approved_member() then
    new.status = 'PENDING_REVIEW';
  else
    new.status = 'PENDING_MEMBER_APPROVAL';
    new.price = null;
    new.price_type = 'ON_REQUEST';
    new.benefit = null;
    new.website = null;
    new.published_at = null;
  end if;

  return new;
end;
$$;

create trigger listings_apply_submission_rules
before insert or update on public.listings
for each row execute function public.apply_listing_submission_rules();

alter table public.profiles enable row level security;
alter table public.member_verifications enable row level security;
alter table public.app_admins enable row level security;
alter table public.categories enable row level security;
alter table public.listings enable row level security;
alter table public.listing_contacts enable row level security;
alter table public.favorites enable row level security;
alter table public.moderation_events enable row level security;

create policy profiles_select
on public.profiles for select
to authenticated
using (
  id = (select auth.uid())
  or status = 'APPROVED'
  or public.is_admin()
);

create policy profiles_update_own
on public.profiles for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy profiles_admin_all
on public.profiles for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy member_verifications_select_own
on public.member_verifications for select
to authenticated
using (user_id = (select auth.uid()) or public.is_admin());

create policy member_verifications_insert_own
on public.member_verifications for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and status = 'PENDING'
  and reviewed_at is null
  and reviewed_by is null
);

create policy member_verifications_admin_all
on public.member_verifications for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy app_admins_select
on public.app_admins for select
to authenticated
using (public.is_admin());

create policy categories_select
on public.categories for select
to authenticated
using (active = true or public.is_admin());

create policy listings_select
on public.listings for select
to authenticated
using (
  owner_id = (select auth.uid())
  or public.is_admin()
  or (
    status = 'PUBLISHED'
    and (is_preview = true or public.is_approved_member())
  )
);

create policy listings_insert_own
on public.listings for insert
to authenticated
with check (owner_id = (select auth.uid()));

create policy listings_update_own
on public.listings for update
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy listings_delete_own_unpublished
on public.listings for delete
to authenticated
using (
  owner_id = (select auth.uid())
  and status <> 'PUBLISHED'
);

create policy listings_admin_all
on public.listings for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy listing_contacts_select
on public.listing_contacts for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.listings l
    where l.id = listing_contacts.listing_id
      and (
        l.owner_id = (select auth.uid())
        or (l.status = 'PUBLISHED' and public.is_approved_member())
      )
  )
);

create policy listing_contacts_insert
on public.listing_contacts for insert
to authenticated
with check (
  public.is_admin()
  or (
    public.is_approved_member()
    and exists (
      select 1 from public.listings l
      where l.id = listing_contacts.listing_id
        and l.owner_id = (select auth.uid())
    )
  )
);

create policy listing_contacts_update
on public.listing_contacts for update
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.listings l
    where l.id = listing_contacts.listing_id
      and l.owner_id = (select auth.uid())
      and public.is_approved_member()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1 from public.listings l
    where l.id = listing_contacts.listing_id
      and l.owner_id = (select auth.uid())
      and public.is_approved_member()
  )
);

create policy favorites_own
on public.favorites for all
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy moderation_events_admin_select
on public.moderation_events for select
to authenticated
using (public.is_admin());

create or replace function public.admin_review_member(
  target_user_id uuid,
  decision public.member_status,
  review_reason text default null
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

  if decision not in ('APPROVED', 'REJECTED', 'SUSPENDED') then
    raise exception 'Decisão inválida';
  end if;

  update public.member_verifications
  set status = decision,
      reviewed_at = now(),
      reviewed_by = auth.uid(),
      decision_reason = review_reason
  where user_id = target_user_id;

  if not found then
    raise exception 'Solicitação não encontrada';
  end if;

  update public.profiles
  set status = decision,
      approved_at = case when decision = 'APPROVED' then coalesce(approved_at, now()) else approved_at end
  where id = target_user_id;

  if decision = 'APPROVED' then
    update public.listings
    set status = 'PENDING_REVIEW'
    where owner_id = target_user_id
      and status = 'PENDING_MEMBER_APPROVAL';
  else
    update public.listings
    set status = 'PAUSED', published_at = null
    where owner_id = target_user_id
      and status in ('PUBLISHED', 'PENDING_REVIEW');
  end if;

  insert into public.moderation_events (
    actor_id, entity_type, entity_id, action, reason
  ) values (
    auth.uid(), 'MEMBER', target_user_id, decision::text, review_reason
  );
end;
$$;

create or replace function public.admin_review_listing(
  target_listing_id uuid,
  decision public.listing_status,
  review_reason text default null,
  preview_for_pending boolean default false
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

  if decision not in ('PUBLISHED', 'REJECTED', 'PAUSED', 'REMOVED') then
    raise exception 'Decisão inválida';
  end if;

  update public.listings
  set status = decision,
      is_preview = case when decision = 'PUBLISHED' then preview_for_pending else false end,
      published_at = case when decision = 'PUBLISHED' then now() else null end
  where id = target_listing_id;

  if not found then
    raise exception 'Oferta não encontrada';
  end if;

  insert into public.moderation_events (
    actor_id, entity_type, entity_id, action, reason,
    metadata
  ) values (
    auth.uid(), 'LISTING', target_listing_id, decision::text, review_reason,
    jsonb_build_object('preview_for_pending', preview_for_pending)
  );
end;
$$;

revoke all on function public.is_admin(uuid) from public;
revoke all on function public.is_approved_member(uuid) from public;
revoke all on function public.admin_review_member(uuid, public.member_status, text) from public;
revoke all on function public.admin_review_listing(uuid, public.listing_status, text, boolean) from public;

grant execute on function public.is_admin(uuid) to authenticated;
grant execute on function public.is_approved_member(uuid) to authenticated;
grant execute on function public.admin_review_member(uuid, public.member_status, text) to authenticated;
grant execute on function public.admin_review_listing(uuid, public.listing_status, text, boolean) to authenticated;

grant select, update on public.profiles to authenticated;
grant select, insert on public.member_verifications to authenticated;
grant select on public.app_admins to authenticated;
grant select on public.categories to authenticated;
grant select, insert, update, delete on public.listings to authenticated;
grant select, insert, update, delete on public.listing_contacts to authenticated;
grant select, insert, update, delete on public.favorites to authenticated;
grant select on public.moderation_events to authenticated;

commit;
