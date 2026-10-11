begin;

create table if not exists public.lodge_invitations (
  id uuid primary key default gen_random_uuid(),
  lodge_id uuid not null references public.lodges(id) on delete cascade,
  email text not null,
  full_name text not null,
  phone text,
  role text not null default 'MEMBER' check (role in ('MEMBER','SECRETARY','TREASURER')),
  status text not null default 'PENDING' check (status in ('PENDING','ACCEPTED','CANCELED')),
  invited_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique (lodge_id, email)
);

alter table public.lodge_invitations enable row level security;

create policy "managers manage lodge invitations"
on public.lodge_invitations
for all
using (public.can_manage_lodge(lodge_id))
with check (public.can_manage_lodge(lodge_id));

create policy "invitee reads own invitation"
on public.lodge_invitations
for select
using (lower(email) = lower(coalesce(auth.jwt()->>'email', '')));

create or replace function public.accept_lodge_invitations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  accepted_count integer := 0;
begin
  insert into public.lodge_memberships (lodge_id, member_id, role, status, verified_at)
  select i.lodge_id, auth.uid(), i.role, 'ACTIVE', now()
  from public.lodge_invitations i
  where lower(i.email) = lower(coalesce(auth.jwt()->>'email', ''))
    and i.status = 'PENDING'
  on conflict (lodge_id, member_id) do update
    set role = excluded.role,
        status = 'ACTIVE',
        verified_at = coalesce(public.lodge_memberships.verified_at, now());

  update public.lodge_invitations
  set status = 'ACCEPTED', accepted_at = now()
  where lower(email) = lower(coalesce(auth.jwt()->>'email', ''))
    and status = 'PENDING';

  get diagnostics accepted_count = row_count;
  return accepted_count;
end;
$$;

grant execute on function public.accept_lodge_invitations() to authenticated;

commit;
