begin;

create or replace function public.can_manage_member(target_member uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_connexio_admin() or exists (
    select 1
    from public.lodge_memberships mine
    join public.lodge_memberships theirs on theirs.lodge_id = mine.lodge_id
    where mine.member_id = auth.uid()
      and mine.status = 'ACTIVE'
      and mine.role in ('SECRETARY','TREASURER','WORSHIPFUL_MASTER')
      and theirs.member_id = target_member
      and theirs.status = 'ACTIVE'
  );
$$;

create policy "lodge managers read member profiles"
on public.member_profiles
for select
using (public.can_manage_member(id));

commit;
