begin;

alter table public.lodge_minutes
  add column if not exists transcript text,
  add column if not exists generated_text text,
  add column if not exists attendance_snapshot jsonb not null default '[]'::jsonb,
  add column if not exists submitted_at timestamptz,
  add column if not exists reviewer_id uuid references auth.users(id) on delete set null,
  add column if not exists approved_by uuid references auth.users(id) on delete set null,
  add column if not exists approved_at timestamptz,
  add column if not exists published_at timestamptz,
  add column if not exists audience text not null default 'ALL';

alter table public.lodge_minutes drop constraint if exists lodge_minutes_status_check;
alter table public.lodge_minutes
  add constraint lodge_minutes_status_check check (status in ('DRAFT','IN_REVIEW','APPROVED','PUBLISHED','ARCHIVED'));

alter table public.lodge_minutes drop constraint if exists lodge_minutes_audience_check;
alter table public.lodge_minutes
  add constraint lodge_minutes_audience_check check (audience in ('ALL','APPRENTICE','FELLOWCRAFT','MASTER','LEADERSHIP'));

create or replace function public.submit_minutes_for_review(target_minutes uuid)
returns void
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  row_minutes public.lodge_minutes%rowtype;
  master_id uuid;
begin
  select * into row_minutes from public.lodge_minutes where id=target_minutes;
  if row_minutes.id is null then raise exception 'Ata não encontrada'; end if;
  if not public.can_use_lodge_pro(row_minutes.lodge_id) then raise exception 'Gestor Pro necessário'; end if;

  select member_id into master_id
  from public.lodge_memberships
  where lodge_id=row_minutes.lodge_id and status='ACTIVE' and role='WORSHIPFUL_MASTER'
  order by verified_at desc nulls last, created_at asc
  limit 1;

  update public.lodge_minutes
  set status='IN_REVIEW', reviewer_id=master_id, submitted_at=now(), updated_at=now()
  where id=target_minutes;
end;$$;

grant execute on function public.submit_minutes_for_review(uuid) to authenticated;

create or replace function public.approve_minutes(target_minutes uuid)
returns void
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  row_minutes public.lodge_minutes%rowtype;
  allowed boolean := false;
begin
  select * into row_minutes from public.lodge_minutes where id=target_minutes;
  if row_minutes.id is null then raise exception 'Ata não encontrada'; end if;

  select public.is_connexio_admin() or exists(
    select 1 from public.lodge_memberships m
    where m.lodge_id=row_minutes.lodge_id and m.member_id=auth.uid()
      and m.status='ACTIVE' and m.role='WORSHIPFUL_MASTER'
  ) into allowed;

  if not allowed then raise exception 'Somente o Venerável pode aprovar a ata'; end if;

  update public.lodge_minutes
  set status='APPROVED', approved_by=auth.uid(), approved_at=now(), updated_at=now()
  where id=target_minutes;
end;$$;

grant execute on function public.approve_minutes(uuid) to authenticated;

create or replace function public.publish_minutes(target_minutes uuid, target_audience text default 'ALL')
returns uuid
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  row_minutes public.lodge_minutes%rowtype;
  feed_id uuid;
  summary_text text;
begin
  select * into row_minutes from public.lodge_minutes where id=target_minutes;
  if row_minutes.id is null then raise exception 'Ata não encontrada'; end if;
  if not public.can_use_lodge_pro(row_minutes.lodge_id) then raise exception 'Gestor Pro necessário'; end if;
  if target_audience not in ('ALL','APPRENTICE','FELLOWCRAFT','MASTER','LEADERSHIP') then raise exception 'Público inválido'; end if;

  summary_text := coalesce(nullif(row_minutes.decisions,''), nullif(row_minutes.matters,''), 'Ata disponível para consulta na Loja.');

  feed_id := public.publish_lodge_item(
    row_minutes.lodge_id,
    'MINUTES',
    'Ata · ' || row_minutes.session_label || ' · ' || to_char(row_minutes.meeting_date,'DD/MM/YYYY'),
    left(summary_text, 1200),
    row_minutes.id,
    target_audience
  );

  update public.lodge_minutes
  set status='PUBLISHED', audience=target_audience, published_at=now(), updated_at=now()
  where id=target_minutes;

  return feed_id;
end;$$;

grant execute on function public.publish_minutes(uuid,text) to authenticated;

commit;
