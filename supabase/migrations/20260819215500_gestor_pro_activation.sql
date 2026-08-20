begin;

create table if not exists public.lodge_plan_requests (
  id uuid primary key default gen_random_uuid(),
  lodge_id uuid not null references public.lodges(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete cascade,
  requested_plan text not null default 'PRO' check (requested_plan = 'PRO'),
  status text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED','CANCELED')),
  commercial_note text,
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references auth.users(id) on delete set null
);

create unique index if not exists lodge_plan_requests_one_pending
on public.lodge_plan_requests(lodge_id)
where status = 'PENDING';

alter table public.lodge_plan_requests enable row level security;

create policy "managers create pro request" on public.lodge_plan_requests
for insert with check (requested_by = auth.uid() and public.can_manage_lodge(lodge_id));

create policy "managers read own lodge plan requests" on public.lodge_plan_requests
for select using (public.can_manage_lodge(lodge_id) or public.is_connexio_admin());

create policy "admins update pro requests" on public.lodge_plan_requests
for update using (public.is_connexio_admin()) with check (public.is_connexio_admin());

create or replace function public.admin_decide_lodge_pro_request(target_request uuid, approve boolean, note text default null)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  req public.lodge_plan_requests%rowtype;
begin
  if not public.is_connexio_admin() then
    raise exception 'Acesso administrativo necessário';
  end if;
  select * into req from public.lodge_plan_requests where id = target_request and status = 'PENDING' for update;
  if not found then raise exception 'Solicitação não encontrada ou já decidida'; end if;

  update public.lodge_plan_requests
  set status = case when approve then 'APPROVED' else 'REJECTED' end,
      commercial_note = nullif(trim(note), ''),
      decided_at = now(),
      decided_by = auth.uid()
  where id = target_request;

  if approve then
    update public.lodges set plan = 'PRO', updated_at = now() where id = req.lodge_id;
  end if;

  insert into public.lodge_audit_log(lodge_id, actor_id, action, entity_type, entity_id, metadata)
  values(req.lodge_id, auth.uid(), case when approve then 'PRO_ACTIVATED' else 'PRO_REJECTED' end, 'LODGE_PLAN_REQUEST', target_request::text, jsonb_build_object('note', note));
end;
$$;

revoke all on function public.admin_decide_lodge_pro_request(uuid, boolean, text) from public;
grant execute on function public.admin_decide_lodge_pro_request(uuid, boolean, text) to authenticated;

commit;
