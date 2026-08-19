begin;

-- Reaproveita os administradores do Connexio legado no novo domínio Gestor.
insert into public.connexio_admins (user_id)
select a.user_id
from public.app_admins a
on conflict (user_id) do nothing;

-- Backfill dos membros que já existiam antes do Gestor.
insert into public.member_profiles (
  id,
  full_name,
  email,
  phone,
  city,
  region,
  lodge_name,
  status,
  created_at,
  updated_at
)
select
  p.id,
  coalesce(nullif(p.full_name, ''), split_part(p.email, '@', 1)),
  p.email,
  p.phone,
  coalesce(p.city, ''),
  coalesce(p.region, ''),
  coalesce(p.lodge_name, ''),
  case
    when p.status::text = 'APPROVED' then 'APPROVED'
    when p.status::text = 'REJECTED' then 'REJECTED'
    else 'PENDING'
  end,
  p.created_at,
  p.updated_at
from public.profiles p
on conflict (id) do update
set
  full_name = excluded.full_name,
  email = excluded.email,
  phone = excluded.phone,
  city = excluded.city,
  region = excluded.region,
  lodge_name = excluded.lodge_name,
  status = excluded.status,
  updated_at = excluded.updated_at;

-- Mantém a aprovação do legado como fonte válida para o perfil novo.
update public.member_profiles mp
set status = case
  when mv.status::text = 'APPROVED' then 'APPROVED'
  when mv.status::text = 'REJECTED' then 'REJECTED'
  else mp.status
end,
updated_at = now()
from public.member_verifications mv
where mv.user_id = mp.id;

commit;
