begin;

create table if not exists public.lodge_management_tasks (
  id uuid primary key default gen_random_uuid(),
  lodge_id uuid not null references public.lodges(id) on delete cascade,
  title text not null,
  description text,
  due_at timestamptz,
  responsible_member_id uuid references auth.users(id) on delete set null,
  source text not null default 'MANUAL' check (source in ('MANUAL','OBLIGATION','SESSION','PLAN','FINANCE','MEMBER_FOLLOWUP')),
  status text not null default 'OPEN' check (status in ('OPEN','DONE','CANCELLED')),
  priority text not null default 'NORMAL' check (priority in ('NORMAL','HIGH')),
  created_by uuid not null references auth.users(id),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lodge_sessions (
  id uuid primary key default gen_random_uuid(),
  lodge_id uuid not null references public.lodges(id) on delete cascade,
  title text not null,
  session_type text not null default 'ORDINARY',
  starts_at timestamptz not null,
  location text,
  objective text,
  status text not null default 'PLANNED' check (status in ('PLANNED','OPEN','CLOSED','CANCELLED')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.lodge_attendance (
  session_id uuid not null references public.lodge_sessions(id) on delete cascade,
  member_id uuid not null references auth.users(id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  checked_in_by uuid references auth.users(id) on delete set null,
  method text not null default 'MANUAL' check (method in ('MANUAL','QR')),
  primary key (session_id, member_id)
);

create table if not exists public.lodge_minutes (
  id uuid primary key default gen_random_uuid(),
  lodge_id uuid not null references public.lodges(id) on delete cascade,
  session_id uuid references public.lodge_sessions(id) on delete set null,
  meeting_date date not null,
  location text,
  session_label text not null,
  matters text not null default '',
  decisions text not null default '',
  pending_items text not null default '',
  closing_notes text not null default '',
  status text not null default 'DRAFT' check (status in ('DRAFT','APPROVED','ARCHIVED')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lodge_annual_plans (
  id uuid primary key default gen_random_uuid(),
  lodge_id uuid not null references public.lodges(id) on delete cascade,
  year integer not null check (year between 2020 and 2100),
  vision text,
  status text not null default 'DRAFT' check (status in ('DRAFT','ACTIVE','CLOSED')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lodge_id, year)
);

create table if not exists public.lodge_goals (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.lodge_annual_plans(id) on delete cascade,
  title text not null,
  metric text,
  target_value numeric,
  current_value numeric not null default 0,
  due_date date,
  responsible_member_id uuid references auth.users(id) on delete set null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE','DONE','CANCELLED')),
  created_at timestamptz not null default now()
);

create table if not exists public.lodge_projects (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.lodge_annual_plans(id) on delete cascade,
  title text not null,
  description text,
  responsible_member_id uuid references auth.users(id) on delete set null,
  due_date date,
  status text not null default 'PLANNED' check (status in ('PLANNED','IN_PROGRESS','DONE','CANCELLED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lodge_management_tasks enable row level security;
alter table public.lodge_sessions enable row level security;
alter table public.lodge_attendance enable row level security;
alter table public.lodge_minutes enable row level security;
alter table public.lodge_annual_plans enable row level security;
alter table public.lodge_goals enable row level security;
alter table public.lodge_projects enable row level security;

create policy "managers manage tasks" on public.lodge_management_tasks for all using (public.can_manage_lodge(lodge_id)) with check (public.can_manage_lodge(lodge_id));
create policy "members read sessions" on public.lodge_sessions for select using (public.is_lodge_member(lodge_id));
create policy "managers manage sessions" on public.lodge_sessions for all using (public.can_manage_lodge(lodge_id)) with check (public.can_manage_lodge(lodge_id));
create policy "members read attendance" on public.lodge_attendance for select using (exists(select 1 from public.lodge_sessions s where s.id = session_id and public.is_lodge_member(s.lodge_id)));
create policy "managers manage attendance" on public.lodge_attendance for all using (exists(select 1 from public.lodge_sessions s where s.id = session_id and public.can_manage_lodge(s.lodge_id))) with check (exists(select 1 from public.lodge_sessions s where s.id = session_id and public.can_manage_lodge(s.lodge_id)));
create policy "managers manage minutes" on public.lodge_minutes for all using (public.can_manage_lodge(lodge_id)) with check (public.can_manage_lodge(lodge_id));
create policy "managers manage plans" on public.lodge_annual_plans for all using (public.can_manage_lodge(lodge_id)) with check (public.can_manage_lodge(lodge_id));
create policy "managers manage goals" on public.lodge_goals for all using (exists(select 1 from public.lodge_annual_plans p where p.id = plan_id and public.can_manage_lodge(p.lodge_id))) with check (exists(select 1 from public.lodge_annual_plans p where p.id = plan_id and public.can_manage_lodge(p.lodge_id)));
create policy "managers manage projects" on public.lodge_projects for all using (exists(select 1 from public.lodge_annual_plans p where p.id = plan_id and public.can_manage_lodge(p.lodge_id))) with check (exists(select 1 from public.lodge_annual_plans p where p.id = plan_id and public.can_manage_lodge(p.lodge_id)));

create or replace function public.check_in_member_by_credential(target_session uuid, credential_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  session_row public.lodge_sessions%rowtype;
  credential_row public.member_credentials%rowtype;
begin
  select * into session_row from public.lodge_sessions where id = target_session;
  if session_row.id is null or not public.can_manage_lodge(session_row.lodge_id) then
    raise exception 'Sessão inválida ou acesso negado';
  end if;

  select * into credential_row
  from public.member_credentials
  where public_token = credential_token and status = 'ACTIVE' and lodge_id = session_row.lodge_id
  limit 1;

  if credential_row.id is null then
    raise exception 'Credencial inválida';
  end if;

  insert into public.lodge_attendance(session_id, member_id, checked_in_by, method)
  values (target_session, credential_row.member_id, auth.uid(), 'QR')
  on conflict (session_id, member_id) do nothing;

  return jsonb_build_object('ok', true, 'member_id', credential_row.member_id);
end;
$$;

grant execute on function public.check_in_member_by_credential(uuid, uuid) to authenticated;

create or replace function public.lodge_health_snapshot(target_lodge uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  member_count integer := 0;
  attendance_rate numeric := 0;
  overdue_rate numeric := 0;
  projects_done numeric := 0;
begin
  if not public.can_manage_lodge(target_lodge) then raise exception 'Acesso negado'; end if;
  select count(*) into member_count from public.lodge_memberships where lodge_id = target_lodge and status = 'ACTIVE';
  select coalesce(100.0 * count(a.member_id) / nullif(count(distinct s.id) * greatest(member_count,1),0),0)
    into attendance_rate
    from public.lodge_sessions s left join public.lodge_attendance a on a.session_id = s.id
    where s.lodge_id = target_lodge and s.starts_at >= now() - interval '90 days' and s.status = 'CLOSED';
  select coalesce(100.0 * count(*) filter (where status in ('PENDING','EXPIRED') and due_date < current_date) / nullif(count(*),0),0)
    into overdue_rate from public.lodge_charges where lodge_id = target_lodge;
  select coalesce(100.0 * count(*) filter (where pr.status = 'DONE') / nullif(count(*),0),0)
    into projects_done from public.lodge_projects pr join public.lodge_annual_plans p on p.id = pr.plan_id where p.lodge_id = target_lodge and p.year = extract(year from current_date)::int;
  return jsonb_build_object('attendance_rate', round(attendance_rate,1), 'overdue_rate', round(overdue_rate,1), 'projects_done_rate', round(projects_done,1), 'member_count', member_count);
end;
$$;

grant execute on function public.lodge_health_snapshot(uuid) to authenticated;

commit;
