-- Execute uma única vez no SQL Editor, depois de criar a conta
-- henriquecampos66@gmail.com pelo aplicativo Connexio.

do $$
declare
  owner_id uuid;
begin
  select id into owner_id
  from public.profiles
  where lower(email) = 'henriquecampos66@gmail.com'
  limit 1;

  if owner_id is null then
    raise exception 'Crie primeiro a conta henriquecampos66@gmail.com no Connexio.';
  end if;

  insert into public.app_admins (user_id)
  values (owner_id)
  on conflict (user_id) do nothing;

  update public.profiles
  set status = 'APPROVED',
      approved_at = coalesce(approved_at, now()),
      updated_at = now()
  where id = owner_id;

  update public.member_verifications
  set status = 'APPROVED',
      reviewed_at = coalesce(reviewed_at, now()),
      reviewed_by = owner_id,
      decision_reason = coalesce(decision_reason, 'Administrador fundador da plataforma')
  where user_id = owner_id;

  update public.listings
  set status = 'PENDING_REVIEW'
  where owner_id = owner_id
    and status = 'PENDING_MEMBER_APPROVAL';
end;
$$;

select
  p.email,
  p.status,
  public.is_admin(p.id) as is_admin
from public.profiles p
where lower(p.email) = 'henriquecampos66@gmail.com';
