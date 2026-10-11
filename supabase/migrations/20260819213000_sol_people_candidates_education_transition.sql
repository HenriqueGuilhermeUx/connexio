begin;

alter table public.lodge_management_tasks
  add column if not exists source_entity_id text;

create index if not exists lodge_management_tasks_source_idx
  on public.lodge_management_tasks(lodge_id, source, source_entity_id, status);

create table if not exists public.lodge_member_care (
  id uuid primary key default gen_random_uuid(),
  lodge_id uuid not null references public.lodges(id) on delete cascade,
  member_id uuid not null references auth.users(id) on delete cascade,
  degree text not null default 'MASTER' check (degree in ('APPRENTICE','COMPANION','MASTER')),
  mentor_member_id uuid references auth.users(id) on delete set null,
  last_contact_at timestamptz,
  next_followup_at timestamptz,
  followup_status text not null default 'OK' check (followup_status in ('OK','ATTENTION','URGENT')),
  leadership_potential text not null default 'UNASSESSED' check (leadership_potential in ('UNASSESSED','DEVELOPING','HIGH')),
  private_notes text,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(lodge_id, member_id)
);

create table if not exists public.lodge_candidates (
  id uuid primary key default gen_random_uuid(),
  lodge_id uuid not null references public.lodges(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  sponsor_member_id uuid references auth.users(id) on delete set null,
  stage text not null default 'OBSERVATION' check (stage in ('OBSERVATION','SOCIAL_EVENTS','INTERVIEW','INQUIRY','LODGE_DISCUSSION','READY','CLOSED')),
  status text not null default 'ACTIVE' check (status in ('ACTIVE','APPROVED','REJECTED','WITHDRAWN')),
  next_action_at timestamptz,
  notes text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lodge_candidate_checks (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references public.lodge_candidates(id) on delete cascade,
  item_key text not null,
  label text not null,
  is_done boolean not null default false,
  notes text,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  unique(candidate_id, item_key)
);

create table if not exists public.lodge_learning_items (
  id uuid primary key default gen_random_uuid(),
  lodge_id uuid not null references public.lodges(id) on delete cascade,
  title text not null,
  audience text not null check (audience in ('APPRENTICE','COMPANION','MASTER','LEADERSHIP','ALL')),
  category text not null default 'EDUCATION',
  description text,
  active boolean not null default true,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lodge_learning_progress (
  learning_item_id uuid not null references public.lodge_learning_items(id) on delete cascade,
  member_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'PENDING' check (status in ('PENDING','IN_PROGRESS','DONE')),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key(learning_item_id, member_id)
);

create table if not exists public.lodge_handover_items (
  id uuid primary key default gen_random_uuid(),
  lodge_id uuid not null references public.lodges(id) on delete cascade,
  category text not null check (category in ('SECRETARIAT','FINANCE','PATRIMONY','ACCESS','PEOPLE','PROJECTS')),
  title text not null,
  status text not null default 'OPEN' check (status in ('OPEN','DONE','NOT_APPLICABLE')),
  responsible_role text check (responsible_role in ('SECRETARY','TREASURER','WORSHIPFUL_MASTER')),
  due_date date,
  notes text,
  created_by uuid not null references auth.users(id),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(lodge_id, category, title)
);

alter table public.lodge_member_care enable row level security;
alter table public.lodge_candidates enable row level security;
alter table public.lodge_candidate_checks enable row level security;
alter table public.lodge_learning_items enable row level security;
alter table public.lodge_learning_progress enable row level security;
alter table public.lodge_handover_items enable row level security;

create policy "managers manage member care" on public.lodge_member_care
  for all using (public.can_manage_lodge(lodge_id)) with check (public.can_manage_lodge(lodge_id));

create policy "managers manage candidates" on public.lodge_candidates
  for all using (public.can_manage_lodge(lodge_id)) with check (public.can_manage_lodge(lodge_id));

create policy "managers manage candidate checks" on public.lodge_candidate_checks
  for all using (exists(select 1 from public.lodge_candidates c where c.id = candidate_id and public.can_manage_lodge(c.lodge_id)))
  with check (exists(select 1 from public.lodge_candidates c where c.id = candidate_id and public.can_manage_lodge(c.lodge_id)));

create policy "members read lodge learning" on public.lodge_learning_items
  for select using (public.is_lodge_member(lodge_id));
create policy "managers manage lodge learning" on public.lodge_learning_items
  for all using (public.can_manage_lodge(lodge_id)) with check (public.can_manage_lodge(lodge_id));

create policy "members read own learning progress" on public.lodge_learning_progress
  for select using (member_id = auth.uid() or exists(select 1 from public.lodge_learning_items i where i.id = learning_item_id and public.can_manage_lodge(i.lodge_id)));
create policy "managers manage learning progress" on public.lodge_learning_progress
  for all using (exists(select 1 from public.lodge_learning_items i where i.id = learning_item_id and public.can_manage_lodge(i.lodge_id)))
  with check (exists(select 1 from public.lodge_learning_items i where i.id = learning_item_id and public.can_manage_lodge(i.lodge_id)));

create policy "managers manage handover" on public.lodge_handover_items
  for all using (public.can_manage_lodge(lodge_id)) with check (public.can_manage_lodge(lodge_id));

create or replace function public.seed_lodge_learning_path(target_lodge uuid)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  inserted_count integer := 0;
begin
  if not public.can_manage_lodge(target_lodge) then
    raise exception 'Acesso de gestão necessário';
  end if;

  insert into public.lodge_learning_items (lodge_id, title, audience, category, description, created_by)
  select target_lodge, x.title, x.audience, x.category, x.description, auth.uid()
  from (values
    ('Simbolismo básico','APPRENTICE','EDUCATION','Trilha inicial do Aprendiz.'),
    ('História da Ordem','APPRENTICE','EDUCATION','Fundamentos históricos para integração.'),
    ('Direitos e deveres','APPRENTICE','EDUCATION','Responsabilidades e participação na Loja.'),
    ('Filosofia maçônica','COMPANION','EDUCATION','Aprofundamento para Companheiros.'),
    ('Liderança e participação social','COMPANION','LEADERSHIP','Desenvolvimento de participação e serviço.'),
    ('Gestão de Loja','MASTER','LEADERSHIP','Preparação de Mestres para responsabilidades administrativas.'),
    ('Planejamento e indicadores','LEADERSHIP','LEADERSHIP','Metas, projetos e acompanhamento da gestão.'),
    ('Finanças da Loja','LEADERSHIP','LEADERSHIP','Orçamento, balancetes e inadimplência.'),
    ('Comunicação e gestão de conflitos','LEADERSHIP','LEADERSHIP','Desenvolvimento de futuras lideranças.')
  ) as x(title, audience, category, description)
  where not exists (
    select 1 from public.lodge_learning_items i
    where i.lodge_id = target_lodge and i.title = x.title and i.audience = x.audience
  );
  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

create or replace function public.seed_lodge_handover(target_lodge uuid)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  inserted_count integer := 0;
begin
  if not public.can_manage_lodge(target_lodge) then
    raise exception 'Acesso de gestão necessário';
  end if;

  insert into public.lodge_handover_items (lodge_id, category, title, responsible_role, created_by)
  select target_lodge, x.category, x.title, x.responsible_role, auth.uid()
  from (values
    ('SECRETARIAT','Entregar atas e correspondências','SECRETARY'),
    ('FINANCE','Entregar balancetes e posição financeira','TREASURER'),
    ('FINANCE','Relacionar contratos e obrigações em aberto','TREASURER'),
    ('PATRIMONY','Atualizar inventário de móveis e equipamentos','WORSHIPFUL_MASTER'),
    ('ACCESS','Transferir chaves e acessos institucionais','WORSHIPFUL_MASTER'),
    ('PEOPLE','Revisar cadastro e situação de acompanhamento dos membros','SECRETARY'),
    ('PROJECTS','Registrar projetos concluídos, em andamento e pendências','WORSHIPFUL_MASTER'),
    ('SECRETARIAT','Revisar Estatuto, Regimento e documentos da Loja','SECRETARY')
  ) as x(category, title, responsible_role)
  where not exists (
    select 1 from public.lodge_handover_items h
    where h.lodge_id = target_lodge and h.category = x.category and h.title = x.title
  );
  get diagnostics inserted_count = row_count;
  return inserted_count;
end;
$$;

create or replace function public.refresh_lodge_operational_tasks(target_lodge uuid)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  inserted_count integer := 0;
  affected integer := 0;
begin
  if not public.can_manage_lodge(target_lodge) then
    raise exception 'Acesso de gestão necessário';
  end if;

  insert into public.lodge_management_tasks (lodge_id, title, description, due_at, source, source_entity_id, created_by)
  select target_lodge,
         'Revisar cobranças vencidas',
         count(*)::text || ' cobrança(s) estão vencidas e sem baixa.',
         now(), 'FINANCE', 'OVERDUE_CHARGES', auth.uid()
  from public.lodge_charges c
  where c.lodge_id = target_lodge and c.status in ('PENDING','EXPIRED') and c.due_date < current_date
  having count(*) > 0
     and not exists (select 1 from public.lodge_management_tasks t where t.lodge_id = target_lodge and t.source = 'FINANCE' and t.source_entity_id = 'OVERDUE_CHARGES' and t.status = 'OPEN');
  get diagnostics affected = row_count; inserted_count := inserted_count + affected;

  insert into public.lodge_management_tasks (lodge_id, title, description, due_at, source, source_entity_id, created_by)
  select o.lodge_id, 'Vencimento: ' || o.title, coalesce(o.description, 'Obrigação administrativa próxima do vencimento.'),
         o.due_date::timestamptz, 'OBLIGATION', o.id::text, auth.uid()
  from public.lodge_obligations o
  where o.lodge_id = target_lodge and o.status = 'OPEN'
    and o.due_date <= current_date + greatest(o.reminder_days, 0)
    and not exists (select 1 from public.lodge_management_tasks t where t.lodge_id = target_lodge and t.source = 'OBLIGATION' and t.source_entity_id = o.id::text and t.status = 'OPEN');
  get diagnostics affected = row_count; inserted_count := inserted_count + affected;

  insert into public.lodge_management_tasks (lodge_id, title, description, due_at, source, source_entity_id, created_by)
  select s.lodge_id, 'Preparar pauta: ' || s.title, coalesce(s.objective, 'Definir objetivo, pauta e materiais da sessão.'),
         s.starts_at - interval '2 days', 'SESSION', s.id::text, auth.uid()
  from public.lodge_sessions s
  where s.lodge_id = target_lodge and s.status = 'PLANNED'
    and s.starts_at between now() and now() + interval '7 days'
    and not exists (select 1 from public.lodge_management_tasks t where t.lodge_id = target_lodge and t.source = 'SESSION' and t.source_entity_id = s.id::text and t.status = 'OPEN');
  get diagnostics affected = row_count; inserted_count := inserted_count + affected;

  insert into public.lodge_management_tasks (lodge_id, title, description, due_at, source, source_entity_id, created_by)
  select c.lodge_id, 'Acompanhar ' || coalesce(p.full_name, 'irmão'),
         case when c.followup_status = 'URGENT' then 'Acompanhamento marcado como urgente.' else 'Acompanhamento fraternal previsto.' end,
         c.next_followup_at, 'MEMBER_FOLLOWUP', c.member_id::text, auth.uid()
  from public.lodge_member_care c
  left join public.member_profiles p on p.id = c.member_id
  where c.lodge_id = target_lodge and c.next_followup_at is not null and c.next_followup_at <= now()
    and not exists (select 1 from public.lodge_management_tasks t where t.lodge_id = target_lodge and t.source = 'MEMBER_FOLLOWUP' and t.source_entity_id = c.member_id::text and t.status = 'OPEN');
  get diagnostics affected = row_count; inserted_count := inserted_count + affected;

  insert into public.lodge_management_tasks (lodge_id, title, description, due_at, source, source_entity_id, created_by)
  select p.lodge_id, 'Projeto próximo do prazo: ' || pr.title, 'Revise responsável, progresso e pendências do projeto.',
         pr.due_date::timestamptz, 'PLAN', pr.id::text, auth.uid()
  from public.lodge_projects pr
  join public.lodge_annual_plans p on p.id = pr.plan_id
  where p.lodge_id = target_lodge and pr.status <> 'DONE' and pr.due_date is not null
    and pr.due_date <= current_date + 14
    and not exists (select 1 from public.lodge_management_tasks t where t.lodge_id = target_lodge and t.source = 'PLAN' and t.source_entity_id = pr.id::text and t.status = 'OPEN');
  get diagnostics affected = row_count; inserted_count := inserted_count + affected;

  return inserted_count;
end;
$$;

create or replace function public.lodge_people_snapshot(target_lodge uuid)
returns table(
  member_id uuid,
  member_name text,
  degree text,
  last_attendance_at timestamptz,
  attendance_count bigint,
  next_followup_at timestamptz,
  followup_status text,
  leadership_potential text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select m.member_id,
         p.full_name,
         coalesce(c.degree, 'MASTER'),
         max(a.checked_in_at),
         count(a.session_id),
         c.next_followup_at,
         coalesce(c.followup_status, 'OK'),
         coalesce(c.leadership_potential, 'UNASSESSED')
  from public.lodge_memberships m
  join public.member_profiles p on p.id = m.member_id
  left join public.lodge_member_care c on c.lodge_id = m.lodge_id and c.member_id = m.member_id
  left join public.lodge_sessions s on s.lodge_id = m.lodge_id
  left join public.lodge_attendance a on a.session_id = s.id and a.member_id = m.member_id
  where m.lodge_id = target_lodge and m.status = 'ACTIVE' and public.can_manage_lodge(target_lodge)
  group by m.member_id, p.full_name, c.degree, c.next_followup_at, c.followup_status, c.leadership_potential;
$$;

revoke all on function public.seed_lodge_learning_path(uuid) from public;
revoke all on function public.seed_lodge_handover(uuid) from public;
revoke all on function public.refresh_lodge_operational_tasks(uuid) from public;
revoke all on function public.lodge_people_snapshot(uuid) from public;
grant execute on function public.seed_lodge_learning_path(uuid) to authenticated;
grant execute on function public.seed_lodge_handover(uuid) to authenticated;
grant execute on function public.refresh_lodge_operational_tasks(uuid) to authenticated;
grant execute on function public.lodge_people_snapshot(uuid) to authenticated;

commit;
