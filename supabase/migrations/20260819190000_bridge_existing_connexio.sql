begin;

-- Esta migration é uma ponte opcional para o Connexio legado.
-- Em instalação nova, as tabelas antigas podem não existir; nesse caso ela não faz nada.
do $$
begin
  if to_regclass('public.app_admins') is not null then
    execute $sql$
      insert into public.connexio_admins (user_id)
      select a.user_id
      from public.app_admins a
      on conflict (user_id) do nothing
    $sql$;
  end if;

  if to_regclass('public.profiles') is not null then
    execute $sql$
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
        updated_at = excluded.updated_at
    $sql$;
  end if;

  if to_regclass('public.member_verifications') is not null then
    execute $sql$
      update public.member_profiles mp
      set status = case
        when mv.status::text = 'APPROVED' then 'APPROVED'
        when mv.status::text = 'REJECTED' then 'REJECTED'
        else mp.status
      end,
      updated_at = now()
      from public.member_verifications mv
      where mv.user_id = mp.id
    $sql$;
  end if;
end $$;

commit;
