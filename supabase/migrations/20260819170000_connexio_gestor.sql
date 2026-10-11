begin;

create extension if not exists pgcrypto;

create table if not exists public.connexio_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.lodges (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  number text,
  orient text not null,
  region text not null,
  plan text not null default 'FREE' check (plan in ('FREE','PRO')),
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lodge_memberships (
  id uuid primary key default gen_random_uuid(),
  lodge_id uuid not null references public.lodges(id) on delete cascade,
  member_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'MEMBER' check (role in ('MEMBER','SECRETARY','TREASURER','WORSHIPFUL_MASTER')),
  status text not null default 'ACTIVE' check (status in ('ACTIVE','INACTIVE','PENDING')),
  joined_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  unique (lodge_id, member_id)
);

create table if not exists public.management_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  lodge_id uuid references public.lodges(id) on delete set null,
  lodge_name text not null,
  lodge_number text,
  orient text not null,
  region text not null,
  requested_role text not null check (requested_role in ('SECRETARY','TREASURER','WORSHIPFUL_MASTER')),
  evidence_name text not null,
  evidence_path text not null,
  evidence_type text not null check (evidence_type in ('POSSESSION_TERM','APPOINTMENT','OTHER')),
  notes text,
  status text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references auth.users(id) on delete set null
);

create table if not exists public.member_credentials (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references auth.users(id) on delete cascade,
  membership_id uuid not null references public.lodge_memberships(id) on delete cascade,
  lodge_id uuid not null references public.lodges(id) on delete cascade,
  version integer not null default 1,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','REVOKED')),
  issued_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (membership_id, version)
);

create table if not exists public.lodge_announcements (
  id uuid primary key default gen_random_uuid(),
  lodge_id uuid not null references public.lodges(id) on delete cascade,
  title text not null,
  message text not null,
  priority text not null default 'NORMAL' check (priority in ('NORMAL','IMPORTANT')),
  push_requested boolean not null default false,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.lodge_events (
  id uuid primary key default gen_random_uuid(),
  lodge_id uuid not null references public.lodges(id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz not null,
  location text,
  requires_registration boolean not null default false,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.lodge_event_attendees (
  event_id uuid not null references public.lodge_events(id) on delete cascade,
  member_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, member_id)
);

create table if not exists public.lodge_polls (
  id uuid primary key default gen_random_uuid(),
  lodge_id uuid not null references public.lodges(id) on delete cascade,
  question text not null,
  closes_at timestamptz,
  active boolean not null default true,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.lodge_poll_options (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.lodge_polls(id) on delete cascade,
  label text not null,
  position integer not null default 0
);

create table if not exists public.lodge_poll_votes (
  poll_id uuid not null references public.lodge_polls(id) on delete cascade,
  option_id uuid not null references public.lodge_poll_options(id) on delete cascade,
  member_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (poll_id, member_id)
);

create table if not exists public.lodge_financial_entries (
  id uuid primary key default gen_random_uuid(),
  lodge_id uuid not null references public.lodges(id) on delete cascade,
  direction text not null check (direction in ('PAYABLE','RECEIVABLE')),
  description text not null,
  category text,
  amount_cents bigint not null check (amount_cents >= 0),
  due_date date not null,
  status text not null default 'OPEN' check (status in ('OPEN','PAID','CANCELED')),
  recurring boolean not null default false,
  recurrence_rule text,
  paid_at timestamptz,
  attachment_path text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lodge_charges (
  id uuid primary key default gen_random_uuid(),
  lodge_id uuid not null references public.lodges(id) on delete cascade,
  member_id uuid references auth.users(id) on delete set null,
  member_name text not null,
  member_email text,
  member_phone text,
  description text not null,
  amount_cents bigint not null check (amount_cents >= 0),
  due_date date not null,
  status text not null default 'PENDING' check (status in ('PENDING','PAID','CANCELED','EXPIRED')),
  provider text,
  provider_reference text,
  pix_copy_paste text,
  paid_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.lodge_audit_log (
  id bigint generated always as identity primary key,
  lodge_id uuid references public.lodges(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.is_connexio_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.connexio_admins a where a.user_id = auth.uid());
$$;

create or replace function public.is_lodge_member(target_lodge uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.lodge_memberships m
    where m.lodge_id = target_lodge and m.member_id = auth.uid() and m.status = 'ACTIVE'
  );
$$;

create or replace function public.can_manage_lodge(target_lodge uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_connexio_admin() or exists(
    select 1 from public.lodge_memberships m
    where m.lodge_id = target_lodge and m.member_id = auth.uid() and m.status = 'ACTIVE'
      and m.role in ('SECRETARY','TREASURER','WORSHIPFUL_MASTER')
  );
$$;

alter table public.connexio_admins enable row level security;
alter table public.lodges enable row level security;
alter table public.lodge_memberships enable row level security;
alter table public.management_requests enable row level security;
alter table public.member_credentials enable row level security;
alter table public.lodge_announcements enable row level security;
alter table public.lodge_events enable row level security;
alter table public.lodge_event_attendees enable row level security;
alter table public.lodge_polls enable row level security;
alter table public.lodge_poll_options enable row level security;
alter table public.lodge_poll_votes enable row level security;
alter table public.lodge_financial_entries enable row level security;
alter table public.lodge_charges enable row level security;
alter table public.lodge_audit_log enable row level security;

create policy "admins read admins" on public.connexio_admins for select using (public.is_connexio_admin());
create policy "members read lodges" on public.lodges for select using (public.is_lodge_member(id) or public.is_connexio_admin());
create policy "admins manage lodges" on public.lodges for all using (public.is_connexio_admin()) with check (public.is_connexio_admin());

create policy "members read memberships" on public.lodge_memberships for select using (public.is_lodge_member(lodge_id) or public.is_connexio_admin());
create policy "managers insert memberships" on public.lodge_memberships for insert with check (public.can_manage_lodge(lodge_id));
create policy "managers update memberships" on public.lodge_memberships for update using (public.can_manage_lodge(lodge_id)) with check (public.can_manage_lodge(lodge_id));

create policy "requester creates management request" on public.management_requests for insert with check (requester_id = auth.uid());
create policy "requester reads management request" on public.management_requests for select using (requester_id = auth.uid() or public.is_connexio_admin());
create policy "admin decides management request" on public.management_requests for update using (public.is_connexio_admin()) with check (public.is_connexio_admin());

create policy "member reads own credential" on public.member_credentials for select using (member_id = auth.uid() or public.can_manage_lodge(lodge_id));
create policy "manager creates credential" on public.member_credentials for insert with check (public.can_manage_lodge(lodge_id));
create policy "manager updates credential" on public.member_credentials for update using (public.can_manage_lodge(lodge_id));

create policy "members read announcements" on public.lodge_announcements for select using (public.is_lodge_member(lodge_id));
create policy "managers manage announcements" on public.lodge_announcements for all using (public.can_manage_lodge(lodge_id)) with check (public.can_manage_lodge(lodge_id));

create policy "members read events" on public.lodge_events for select using (public.is_lodge_member(lodge_id));
create policy "managers manage events" on public.lodge_events for all using (public.can_manage_lodge(lodge_id)) with check (public.can_manage_lodge(lodge_id));
create policy "members manage own attendance" on public.lodge_event_attendees for all using (member_id = auth.uid()) with check (member_id = auth.uid());

create policy "members read polls" on public.lodge_polls for select using (public.is_lodge_member(lodge_id));
create policy "managers manage polls" on public.lodge_polls for all using (public.can_manage_lodge(lodge_id)) with check (public.can_manage_lodge(lodge_id));
create policy "members read poll options" on public.lodge_poll_options for select using (exists(select 1 from public.lodge_polls p where p.id = poll_id and public.is_lodge_member(p.lodge_id)));
create policy "managers manage poll options" on public.lodge_poll_options for all using (exists(select 1 from public.lodge_polls p where p.id = poll_id and public.can_manage_lodge(p.lodge_id))) with check (exists(select 1 from public.lodge_polls p where p.id = poll_id and public.can_manage_lodge(p.lodge_id)));
create policy "members vote once" on public.lodge_poll_votes for insert with check (member_id = auth.uid() and exists(select 1 from public.lodge_polls p where p.id = poll_id and p.active and public.is_lodge_member(p.lodge_id)));
create policy "members read poll votes" on public.lodge_poll_votes for select using (exists(select 1 from public.lodge_polls p where p.id = poll_id and public.is_lodge_member(p.lodge_id)));

create policy "managers manage finance" on public.lodge_financial_entries for all using (public.can_manage_lodge(lodge_id)) with check (public.can_manage_lodge(lodge_id));
create policy "managers manage charges" on public.lodge_charges for all using (public.can_manage_lodge(lodge_id)) with check (public.can_manage_lodge(lodge_id));
create policy "managers read audit" on public.lodge_audit_log for select using (public.can_manage_lodge(lodge_id));
create policy "authenticated writes audit" on public.lodge_audit_log for insert with check (actor_id = auth.uid() and (lodge_id is null or public.can_manage_lodge(lodge_id)));

insert into storage.buckets (id, name, public)
values ('manager-evidence', 'manager-evidence', false)
on conflict (id) do update set public = excluded.public;

insert into storage.buckets (id, name, public)
values ('lodge-finance-documents', 'lodge-finance-documents', false)
on conflict (id) do update set public = excluded.public;

create policy "user uploads own manager evidence" on storage.objects for insert to authenticated
with check (bucket_id = 'manager-evidence' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "user reads own manager evidence" on storage.objects for select to authenticated
using (bucket_id = 'manager-evidence' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_connexio_admin()));
create policy "manager finance document access" on storage.objects for all to authenticated
using (bucket_id = 'lodge-finance-documents' and public.can_manage_lodge(((storage.foldername(name))[1])::uuid))
with check (bucket_id = 'lodge-finance-documents' and public.can_manage_lodge(((storage.foldername(name))[1])::uuid));

commit;
