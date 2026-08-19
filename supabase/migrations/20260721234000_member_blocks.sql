begin;

create table if not exists public.user_blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint user_blocks_no_self check (blocker_id <> blocked_id)
);

create index if not exists user_blocks_blocker_idx
on public.user_blocks(blocker_id, created_at desc);

alter table public.user_blocks enable row level security;

drop policy if exists user_blocks_select_own on public.user_blocks;
create policy user_blocks_select_own
on public.user_blocks for select
to authenticated
using (blocker_id = (select auth.uid()));

create or replace function public.is_member_blocked(
  target_member_id uuid,
  viewer_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.user_blocks b
    where b.blocker_id = viewer_id
      and b.blocked_id = target_member_id
  );
$$;

create or replace function public.block_member(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Sessão necessária';
  end if;

  if target_user_id = current_user_id then
    raise exception 'Não é possível bloquear a própria conta';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = target_user_id
  ) then
    raise exception 'Membro não encontrado';
  end if;

  insert into public.user_blocks (blocker_id, blocked_id)
  values (current_user_id, target_user_id)
  on conflict do nothing;

  delete from public.favorites f
  using public.listings l
  where f.user_id = current_user_id
    and f.listing_id = l.id
    and l.owner_id = target_user_id;
end;
$$;

create or replace function public.unblock_member(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Sessão necessária';
  end if;

  delete from public.user_blocks
  where blocker_id = current_user_id
    and blocked_id = target_user_id;
end;
$$;

drop policy if exists listings_select on public.listings;
create policy listings_select
on public.listings for select
to authenticated
using (
  owner_id = (select auth.uid())
  or public.is_admin()
  or (
    status = 'PUBLISHED'
    and (is_preview = true or public.is_approved_member())
    and not public.is_member_blocked(owner_id)
  )
);

drop policy if exists listing_contacts_select on public.listing_contacts;
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
        or (
          l.status = 'PUBLISHED'
          and public.is_approved_member()
          and not public.is_member_blocked(l.owner_id)
        )
      )
  )
);

revoke all on function public.is_member_blocked(uuid, uuid) from public;
revoke all on function public.block_member(uuid) from public;
revoke all on function public.unblock_member(uuid) from public;

grant execute on function public.is_member_blocked(uuid, uuid) to authenticated;
grant execute on function public.block_member(uuid) to authenticated;
grant execute on function public.unblock_member(uuid) to authenticated;
grant select on public.user_blocks to authenticated;

commit;
