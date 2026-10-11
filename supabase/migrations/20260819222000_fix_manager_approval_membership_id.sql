begin;

create or replace function public.decide_management_request(target_request uuid, approved boolean, reason text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  req public.management_requests%rowtype;
  resolved_lodge uuid;
  resolved_membership_id uuid;
begin
  if not public.is_connexio_admin() then
    raise exception 'not authorized';
  end if;

  select * into req
  from public.management_requests
  where id = target_request
  for update;

  if req.id is null then
    raise exception 'request not found';
  end if;

  if req.status <> 'PENDING' then
    raise exception 'request already decided';
  end if;

  if approved then
    select l.id into resolved_lodge
    from public.lodges l
    where lower(l.name) = lower(req.lodge_name)
      and coalesce(l.number, '') = coalesce(req.lodge_number, '')
      and lower(l.orient) = lower(req.orient)
    limit 1;

    if resolved_lodge is null then
      insert into public.lodges (name, number, orient, region, plan, verified)
      values (req.lodge_name, req.lodge_number, req.orient, req.region, 'FREE', true)
      returning id into resolved_lodge;
    else
      update public.lodges
      set verified = true, updated_at = now()
      where id = resolved_lodge;
    end if;

    insert into public.lodge_memberships (lodge_id, member_id, role, status, verified_at)
    values (resolved_lodge, req.requester_id, req.requested_role, 'ACTIVE', now())
    on conflict (lodge_id, member_id) do update
      set role = excluded.role,
          status = 'ACTIVE',
          verified_at = now()
    returning id into resolved_membership_id;

    insert into public.member_credentials (member_id, membership_id, lodge_id, version, status)
    values (req.requester_id, resolved_membership_id, resolved_lodge, 1, 'ACTIVE')
    on conflict (membership_id, version) do update
      set status = 'ACTIVE',
          revoked_at = null;
  end if;

  update public.management_requests mr
  set status = case when approved then 'APPROVED' else 'REJECTED' end,
      lodge_id = case when approved then resolved_lodge else mr.lodge_id end,
      decided_at = now(),
      decided_by = auth.uid(),
      notes = case
        when reason is null or btrim(reason) = '' then mr.notes
        when mr.notes is null or btrim(mr.notes) = '' then 'Admin: ' || reason
        else mr.notes || E'\nAdmin: ' || reason
      end
  where mr.id = target_request;

  insert into public.lodge_audit_log (lodge_id, actor_id, action, entity_type, entity_id, metadata)
  values (
    resolved_lodge,
    auth.uid(),
    case when approved then 'MANAGER_REQUEST_APPROVED' else 'MANAGER_REQUEST_REJECTED' end,
    'management_request',
    target_request::text,
    jsonb_build_object('reason', reason, 'requester_id', req.requester_id, 'role', req.requested_role)
  );

  return resolved_lodge;
end;
$$;

grant execute on function public.decide_management_request(uuid, boolean, text) to authenticated;

commit;
