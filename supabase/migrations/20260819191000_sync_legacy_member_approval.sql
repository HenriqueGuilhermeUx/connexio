begin;

create or replace function public.approve_connexio_member(target_user uuid, approved boolean, reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_connexio_admin() then
    raise exception 'not authorized';
  end if;

  update public.member_profiles
  set status = case when approved then 'APPROVED' else 'REJECTED' end,
      updated_at = now()
  where id = target_user;

  update public.member_verifications
  set status = case when approved then 'APPROVED' else 'REJECTED' end,
      reviewed_at = now(),
      reviewed_by = auth.uid(),
      decision_reason = reason
  where user_id = target_user;

  -- Se o marketplace legado estiver instalado, mantém a governança antiga sincronizada.
  if to_regclass('public.profiles') is not null then
    execute format(
      'update public.profiles set status = %L, approved_at = case when %L = ''APPROVED'' then coalesce(approved_at, now()) else approved_at end, updated_at = now() where id = %L::uuid',
      case when approved then 'APPROVED' else 'REJECTED' end,
      case when approved then 'APPROVED' else 'REJECTED' end,
      target_user::text
    );
  end if;

  insert into public.lodge_audit_log (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    case when approved then 'MEMBER_APPROVED' else 'MEMBER_REJECTED' end,
    'member',
    target_user::text,
    jsonb_build_object('reason', reason, 'legacy_synced', to_regclass('public.profiles') is not null)
  );
end;
$$;

grant execute on function public.approve_connexio_member(uuid, boolean, text) to authenticated;

commit;
