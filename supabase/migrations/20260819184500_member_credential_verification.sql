begin;

alter table public.member_credentials
add column if not exists verification_token uuid not null default gen_random_uuid();

create unique index if not exists member_credentials_verification_token_idx
on public.member_credentials (verification_token);

create or replace function public.verify_member_credential(token uuid)
returns table (
  valid boolean,
  member_name text,
  lodge_name text,
  lodge_number text,
  orient text,
  role text,
  issued_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    (c.status = 'ACTIVE' and m.status = 'ACTIVE' and l.verified and p.status = 'APPROVED') as valid,
    p.full_name as member_name,
    l.name as lodge_name,
    l.number as lodge_number,
    l.orient,
    m.role,
    c.issued_at
  from public.member_credentials c
  join public.lodge_memberships m on m.id = c.membership_id
  join public.lodges l on l.id = c.lodge_id
  join public.member_profiles p on p.id = c.member_id
  where c.verification_token = token
  limit 1;
$$;

grant execute on function public.verify_member_credential(uuid) to authenticated;

create or replace function public.accept_lodge_invitations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  invitation record;
  resolved_membership uuid;
  accepted_count integer := 0;
begin
  for invitation in
    select * from public.lodge_invitations i
    where lower(i.email) = lower(coalesce(auth.jwt()->>'email', ''))
      and i.status = 'PENDING'
    for update
  loop
    insert into public.lodge_memberships (lodge_id, member_id, role, status, verified_at)
    values (invitation.lodge_id, auth.uid(), invitation.role, 'ACTIVE', now())
    on conflict (lodge_id, member_id) do update
      set role = excluded.role,
          status = 'ACTIVE',
          verified_at = coalesce(public.lodge_memberships.verified_at, now())
    returning id into resolved_membership;

    insert into public.member_credentials (member_id, membership_id, lodge_id, version, status)
    values (auth.uid(), resolved_membership, invitation.lodge_id, 1, 'ACTIVE')
    on conflict (membership_id, version) do update
      set status = 'ACTIVE', revoked_at = null;

    update public.lodge_invitations
    set status = 'ACCEPTED', accepted_at = now()
    where id = invitation.id;

    accepted_count := accepted_count + 1;
  end loop;

  return accepted_count;
end;
$$;

commit;
