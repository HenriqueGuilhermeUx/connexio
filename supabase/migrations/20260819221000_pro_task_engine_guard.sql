begin;

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
  if not public.can_use_lodge_pro(target_lodge) then
    raise exception 'Gestor Pro necessário';
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

revoke all on function public.refresh_lodge_operational_tasks(uuid) from public;
grant execute on function public.refresh_lodge_operational_tasks(uuid) to authenticated;

commit;
