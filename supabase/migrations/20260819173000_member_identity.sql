begin;

create table if not exists public.member_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text not null,
  city text not null,
  region text not null,
  lodge_name text not null,
  status text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.member_verifications (
  user_id uuid primary key references auth.users(id) on delete cascade,
  cim_number text not null,
  cim_last4 text not null,
  status text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED')),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  decision_reason text
);

create or replace function public.handle_connexio_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  cim text := coalesce(metadata->>'cim_number', '');
begin
  insert into public.member_profiles (id, full_name, email, phone, city, region, lodge_name)
  values (
    new.id,
    coalesce(metadata->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.email, ''),
    coalesce(metadata->>'phone', ''),
    coalesce(metadata->>'city', ''),
    coalesce(metadata->>'region', ''),
    coalesce(metadata->>'lodge_name', '')
  )
  on conflict (id) do nothing;

  if cim <> '' then
    insert into public.member_verifications (user_id, cim_number, cim_last4)
    values (new.id, cim, right(cim, 4))
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_connexio on auth.users;
create trigger on_auth_user_created_connexio
after insert on auth.users
for each row execute function public.handle_connexio_signup();

alter table public.member_profiles enable row level security;
alter table public.member_verifications enable row level security;

drop policy if exists "member reads own profile" on public.member_profiles;
create policy "member reads own profile" on public.member_profiles for select
using (id = auth.uid() or public.is_connexio_admin());

drop policy if exists "member updates own profile" on public.member_profiles;
create policy "member updates own profile" on public.member_profiles for update
using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "admin reviews profiles" on public.member_profiles;
create policy "admin reviews profiles" on public.member_profiles for update
using (public.is_connexio_admin()) with check (public.is_connexio_admin());

drop policy if exists "member reads own verification" on public.member_verifications;
create policy "member reads own verification" on public.member_verifications for select
using (user_id = auth.uid() or public.is_connexio_admin());

drop policy if exists "admin reviews verification" on public.member_verifications;
create policy "admin reviews verification" on public.member_verifications for update
using (public.is_connexio_admin()) with check (public.is_connexio_admin());

-- O projeto histórico do Connexio já possui admin_member_queue com uma forma
-- diferente. PostgreSQL não permite remover/reordenar colunas via CREATE OR
-- REPLACE VIEW, por isso a view administrativa é recriada. Nenhuma tabela ou
-- dado de membro é removido por este DROP VIEW.
drop view if exists public.admin_member_queue;

create view public.admin_member_queue
with (security_invoker = true)
as
select
  p.id,
  p.full_name,
  p.email,
  p.phone,
  p.city,
  p.region,
  p.lodge_name,
  p.status,
  p.created_at,
  v.cim_last4,
  v.submitted_at,
  v.reviewed_at,
  v.decision_reason
from public.member_profiles p
left join public.member_verifications v on v.user_id = p.id
where p.status = 'PENDING';

grant select on public.admin_member_queue to authenticated;

commit;
