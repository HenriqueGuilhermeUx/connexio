begin;

-- Imagens de ofertas
create table if not exists public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  storage_path text not null unique,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists listing_images_listing_idx
  on public.listing_images(listing_id, position);

alter table public.listing_images enable row level security;

drop policy if exists listing_images_select on public.listing_images;
create policy listing_images_select
on public.listing_images for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.listings l
    where l.id = listing_images.listing_id
      and (
        l.owner_id = (select auth.uid())
        or (
          l.status = 'PUBLISHED'
          and (l.is_preview = true or public.is_approved_member())
        )
      )
  )
);

drop policy if exists listing_images_insert_own on public.listing_images;
create policy listing_images_insert_own
on public.listing_images for insert
to authenticated
with check (
  public.is_admin()
  or exists (
    select 1
    from public.listings l
    where l.id = listing_images.listing_id
      and l.owner_id = (select auth.uid())
  )
);

drop policy if exists listing_images_update_own on public.listing_images;
create policy listing_images_update_own
on public.listing_images for update
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.listings l
    where l.id = listing_images.listing_id
      and l.owner_id = (select auth.uid())
  )
)
with check (
  public.is_admin()
  or exists (
    select 1
    from public.listings l
    where l.id = listing_images.listing_id
      and l.owner_id = (select auth.uid())
  )
);

drop policy if exists listing_images_delete_own on public.listing_images;
create policy listing_images_delete_own
on public.listing_images for delete
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.listings l
    where l.id = listing_images.listing_id
      and l.owner_id = (select auth.uid())
  )
);

-- Bucket privado; as URLs serão assinadas pelo cliente autenticado.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-images',
  'listing-images',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Caminho obrigatório: <user_id>/<listing_id>/<arquivo>
drop policy if exists listing_images_storage_select on storage.objects;
create policy listing_images_storage_select
on storage.objects for select
to authenticated
using (
  bucket_id = 'listing-images'
  and (
    public.is_admin()
    or exists (
      select 1
      from public.listing_images li
      join public.listings l on l.id = li.listing_id
      where li.storage_path = name
        and (
          l.owner_id = (select auth.uid())
          or (
            l.status = 'PUBLISHED'
            and (l.is_preview = true or public.is_approved_member())
          )
        )
    )
  )
);

drop policy if exists listing_images_storage_insert on storage.objects;
create policy listing_images_storage_insert
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'listing-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists listing_images_storage_update on storage.objects;
create policy listing_images_storage_update
on storage.objects for update
to authenticated
using (
  bucket_id = 'listing-images'
  and (
    public.is_admin()
    or (storage.foldername(name))[1] = (select auth.uid())::text
  )
)
with check (
  bucket_id = 'listing-images'
  and (
    public.is_admin()
    or (storage.foldername(name))[1] = (select auth.uid())::text
  )
);

drop policy if exists listing_images_storage_delete on storage.objects;
create policy listing_images_storage_delete
on storage.objects for delete
to authenticated
using (
  bucket_id = 'listing-images'
  and (
    public.is_admin()
    or (storage.foldername(name))[1] = (select auth.uid())::text
  )
);

-- Exposição segura para o painel: o CIM completo continua restrito aos admins.
create or replace view public.admin_member_queue
with (security_invoker = true)
as
select
  p.id,
  p.full_name,
  p.email,
  p.phone,
  p.city,
  p.region,
  p.status,
  p.created_at,
  mv.cim_number,
  mv.cim_last4,
  mv.submitted_at,
  mv.reviewed_at,
  mv.decision_reason,
  count(l.id) filter (where l.status = 'PENDING_MEMBER_APPROVAL')::integer as pending_offers
from public.profiles p
join public.member_verifications mv on mv.user_id = p.id
left join public.listings l on l.owner_id = p.id
group by
  p.id,
  p.full_name,
  p.email,
  p.phone,
  p.city,
  p.region,
  p.status,
  p.created_at,
  mv.cim_number,
  mv.cim_last4,
  mv.submitted_at,
  mv.reviewed_at,
  mv.decision_reason;

create or replace view public.admin_listing_queue
with (security_invoker = true)
as
select
  l.id,
  l.owner_id,
  p.full_name as owner_name,
  p.email as owner_email,
  l.type,
  l.title,
  l.description,
  l.category_slug,
  c.name as category_name,
  l.city,
  l.region,
  l.price,
  l.price_type,
  l.benefit,
  l.website,
  l.status,
  l.is_preview,
  l.created_at,
  count(li.id)::integer as image_count
from public.listings l
join public.profiles p on p.id = l.owner_id
join public.categories c on c.slug = l.category_slug
left join public.listing_images li on li.listing_id = l.id
group by
  l.id,
  p.full_name,
  p.email,
  c.name;

grant select on public.admin_member_queue to authenticated;
grant select on public.admin_listing_queue to authenticated;
grant select, insert, update, delete on public.listing_images to authenticated;

commit;
