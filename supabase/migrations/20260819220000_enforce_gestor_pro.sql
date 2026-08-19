begin;

create or replace function public.can_use_lodge_pro(target_lodge uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_connexio_admin() or (
    public.can_manage_lodge(target_lodge)
    and exists(select 1 from public.lodges l where l.id = target_lodge and l.plan = 'PRO')
  );
$$;

grant execute on function public.can_use_lodge_pro(uuid) to authenticated;

-- Finance / cobrança / obrigações.
drop policy if exists "managers manage finance" on public.lodge_financial_entries;
create policy "pro managers manage finance" on public.lodge_financial_entries for all using (public.can_use_lodge_pro(lodge_id)) with check (public.can_use_lodge_pro(lodge_id));
drop policy if exists "managers manage charges" on public.lodge_charges;
create policy "pro managers manage charges" on public.lodge_charges for all using (public.can_use_lodge_pro(lodge_id)) with check (public.can_use_lodge_pro(lodge_id));
drop policy if exists "managers manage obligations" on public.lodge_obligations;
create policy "pro managers manage obligations" on public.lodge_obligations for all using (public.can_use_lodge_pro(lodge_id)) with check (public.can_use_lodge_pro(lodge_id));

-- SOL Pro: Hoje, atas e planejamento.
drop policy if exists "managers manage tasks" on public.lodge_management_tasks;
create policy "pro managers manage tasks" on public.lodge_management_tasks for all using (public.can_use_lodge_pro(lodge_id)) with check (public.can_use_lodge_pro(lodge_id));
drop policy if exists "managers manage minutes" on public.lodge_minutes;
create policy "pro managers manage minutes" on public.lodge_minutes for all using (public.can_use_lodge_pro(lodge_id)) with check (public.can_use_lodge_pro(lodge_id));
drop policy if exists "managers manage plans" on public.lodge_annual_plans;
create policy "pro managers manage plans" on public.lodge_annual_plans for all using (public.can_use_lodge_pro(lodge_id)) with check (public.can_use_lodge_pro(lodge_id));
drop policy if exists "managers manage goals" on public.lodge_goals;
create policy "pro managers manage goals" on public.lodge_goals for all using (exists(select 1 from public.lodge_annual_plans p where p.id = plan_id and public.can_use_lodge_pro(p.lodge_id))) with check (exists(select 1 from public.lodge_annual_plans p where p.id = plan_id and public.can_use_lodge_pro(p.lodge_id)));
drop policy if exists "managers manage projects" on public.lodge_projects;
create policy "pro managers manage projects" on public.lodge_projects for all using (exists(select 1 from public.lodge_annual_plans p where p.id = plan_id and public.can_use_lodge_pro(p.lodge_id))) with check (exists(select 1 from public.lodge_annual_plans p where p.id = plan_id and public.can_use_lodge_pro(p.lodge_id)));

-- Pessoas / candidatos / educação / transição.
drop policy if exists "managers manage member care" on public.lodge_member_care;
create policy "pro managers manage member care" on public.lodge_member_care for all using (public.can_use_lodge_pro(lodge_id)) with check (public.can_use_lodge_pro(lodge_id));
drop policy if exists "managers manage candidates" on public.lodge_candidates;
create policy "pro managers manage candidates" on public.lodge_candidates for all using (public.can_use_lodge_pro(lodge_id)) with check (public.can_use_lodge_pro(lodge_id));
drop policy if exists "managers manage candidate checks" on public.lodge_candidate_checks;
create policy "pro managers manage candidate checks" on public.lodge_candidate_checks for all using (exists(select 1 from public.lodge_candidates c where c.id = candidate_id and public.can_use_lodge_pro(c.lodge_id))) with check (exists(select 1 from public.lodge_candidates c where c.id = candidate_id and public.can_use_lodge_pro(c.lodge_id)));
drop policy if exists "managers manage lodge learning" on public.lodge_learning_items;
create policy "pro managers manage lodge learning" on public.lodge_learning_items for all using (public.can_use_lodge_pro(lodge_id)) with check (public.can_use_lodge_pro(lodge_id));
drop policy if exists "managers manage learning progress" on public.lodge_learning_progress;
create policy "pro managers manage learning progress" on public.lodge_learning_progress for all using (exists(select 1 from public.lodge_learning_items i where i.id = learning_item_id and public.can_use_lodge_pro(i.lodge_id))) with check (exists(select 1 from public.lodge_learning_items i where i.id = learning_item_id and public.can_use_lodge_pro(i.lodge_id)));
drop policy if exists "managers manage handover" on public.lodge_handover_items;
create policy "pro managers manage handover" on public.lodge_handover_items for all using (public.can_use_lodge_pro(lodge_id)) with check (public.can_use_lodge_pro(lodge_id));

-- Documentos financeiros também respeitam o plano Pro.
drop policy if exists "manager finance document access" on storage.objects;
create policy "pro manager finance document access" on storage.objects for all to authenticated
using (bucket_id = 'lodge-finance-documents' and public.can_use_lodge_pro(((storage.foldername(name))[1])::uuid))
with check (bucket_id = 'lodge-finance-documents' and public.can_use_lodge_pro(((storage.foldername(name))[1])::uuid));

create or replace function public.lodge_health_snapshot(target_lodge uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare member_count integer:=0; attendance_rate numeric:=0; overdue_rate numeric:=0; projects_done numeric:=0; attention_count integer:=0;
begin
  if not public.can_use_lodge_pro(target_lodge) then raise exception 'Gestor Pro necessário'; end if;
  select count(*) into member_count from public.lodge_memberships where lodge_id=target_lodge and status='ACTIVE';
  select coalesce(100.0*count(a.member_id)/nullif(count(distinct s.id)*greatest(member_count,1),0),0) into attendance_rate from public.lodge_sessions s left join public.lodge_attendance a on a.session_id=s.id where s.lodge_id=target_lodge and s.starts_at>=now()-interval '90 days' and s.status='CLOSED';
  select coalesce(100.0*count(*) filter(where status in('PENDING','EXPIRED') and due_date<current_date)/nullif(count(*),0),0) into overdue_rate from public.lodge_charges where lodge_id=target_lodge;
  select coalesce(100.0*count(*) filter(where pr.status='DONE')/nullif(count(*),0),0) into projects_done from public.lodge_projects pr join public.lodge_annual_plans p on p.id=pr.plan_id where p.lodge_id=target_lodge and p.year=extract(year from current_date)::int;
  select count(*) into attention_count from public.lodge_member_care where lodge_id=target_lodge and (followup_status in('ATTENTION','URGENT') or (next_followup_at is not null and next_followup_at<=now()));
  return jsonb_build_object('attendance_rate',round(attendance_rate,1),'overdue_rate',round(overdue_rate,1),'projects_done_rate',round(projects_done,1),'member_count',member_count,'people_attention_count',attention_count);
end;
$$;

-- RPCs Pro são revalidados no servidor mesmo se alguém chamar uma rota/API diretamente.
create or replace function public.seed_lodge_learning_path(target_lodge uuid)
returns integer language plpgsql security definer set search_path=public,pg_temp as $$
declare inserted_count integer:=0;
begin
 if not public.can_use_lodge_pro(target_lodge) then raise exception 'Gestor Pro necessário'; end if;
 insert into public.lodge_learning_items(lodge_id,title,audience,category,description,created_by)
 select target_lodge,x.title,x.audience,x.category,x.description,auth.uid() from (values
 ('Simbolismo básico','APPRENTICE','EDUCATION','Trilha inicial do Aprendiz.'),('História da Ordem','APPRENTICE','EDUCATION','Fundamentos históricos para integração.'),('Direitos e deveres','APPRENTICE','EDUCATION','Responsabilidades e participação na Loja.'),('Filosofia maçônica','COMPANION','EDUCATION','Aprofundamento para Companheiros.'),('Liderança e participação social','COMPANION','LEADERSHIP','Desenvolvimento de participação e serviço.'),('Gestão de Loja','MASTER','LEADERSHIP','Preparação de Mestres para responsabilidades administrativas.'),('Planejamento e indicadores','LEADERSHIP','LEADERSHIP','Metas, projetos e acompanhamento da gestão.'),('Finanças da Loja','LEADERSHIP','LEADERSHIP','Orçamento, balancetes e inadimplência.'),('Comunicação e gestão de conflitos','LEADERSHIP','LEADERSHIP','Desenvolvimento de futuras lideranças.')) as x(title,audience,category,description)
 where not exists(select 1 from public.lodge_learning_items i where i.lodge_id=target_lodge and i.title=x.title and i.audience=x.audience);
 get diagnostics inserted_count=row_count; return inserted_count;
end;$$;

create or replace function public.seed_lodge_handover(target_lodge uuid)
returns integer language plpgsql security definer set search_path=public,pg_temp as $$
declare inserted_count integer:=0;
begin
 if not public.can_use_lodge_pro(target_lodge) then raise exception 'Gestor Pro necessário'; end if;
 insert into public.lodge_handover_items(lodge_id,category,title,responsible_role,created_by)
 select target_lodge,x.category,x.title,x.responsible_role,auth.uid() from (values ('SECRETARIAT','Entregar atas e correspondências','SECRETARY'),('FINANCE','Entregar balancetes e posição financeira','TREASURER'),('FINANCE','Relacionar contratos e obrigações em aberto','TREASURER'),('PATRIMONY','Atualizar inventário de móveis e equipamentos','WORSHIPFUL_MASTER'),('ACCESS','Transferir chaves e acessos institucionais','WORSHIPFUL_MASTER'),('PEOPLE','Revisar cadastro e situação de acompanhamento dos membros','SECRETARY'),('PROJECTS','Registrar projetos concluídos, em andamento e pendências','WORSHIPFUL_MASTER'),('SECRETARIAT','Revisar Estatuto, Regimento e documentos da Loja','SECRETARY')) as x(category,title,responsible_role)
 where not exists(select 1 from public.lodge_handover_items h where h.lodge_id=target_lodge and h.category=x.category and h.title=x.title);
 get diagnostics inserted_count=row_count; return inserted_count;
end;$$;

create or replace function public.lodge_people_snapshot(target_lodge uuid)
returns table(member_id uuid,member_name text,degree text,last_attendance_at timestamptz,attendance_count bigint,next_followup_at timestamptz,followup_status text,leadership_potential text)
language sql stable security definer set search_path=public,pg_temp as $$
 select m.member_id,p.full_name,coalesce(c.degree,'MASTER'),max(a.checked_in_at),count(a.session_id),c.next_followup_at,coalesce(c.followup_status,'OK'),coalesce(c.leadership_potential,'UNASSESSED')
 from public.lodge_memberships m join public.member_profiles p on p.id=m.member_id left join public.lodge_member_care c on c.lodge_id=m.lodge_id and c.member_id=m.member_id left join public.lodge_sessions s on s.lodge_id=m.lodge_id left join public.lodge_attendance a on a.session_id=s.id and a.member_id=m.member_id
 where m.lodge_id=target_lodge and m.status='ACTIVE' and public.can_use_lodge_pro(target_lodge)
 group by m.member_id,p.full_name,c.degree,c.next_followup_at,c.followup_status,c.leadership_potential;
$$;

commit;
