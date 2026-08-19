begin;

create or replace function public.member_matches_lodge_audience(target_lodge uuid, target_audience text)
returns boolean
language sql
stable
security definer
set search_path=public,pg_temp
as $$
  select
    public.is_lodge_member(target_lodge)
    and (
      target_audience='ALL'
      or public.can_manage_lodge(target_lodge)
      or exists(
        select 1
        from public.lodge_member_care c
        where c.lodge_id=target_lodge
          and c.member_id=auth.uid()
          and (
            (target_audience='APPRENTICE' and c.degree='APPRENTICE')
            or (target_audience='COMPANION' and c.degree='COMPANION')
            or (target_audience='MASTER' and c.degree='MASTER')
            or (target_audience='LEADERSHIP' and c.leadership_potential in ('DEVELOPING','HIGH'))
          )
      )
    );
$$;

grant execute on function public.member_matches_lodge_audience(uuid,text) to authenticated;

drop policy if exists "members read lodge feed" on public.lodge_feed_items;
create policy "members read lodge feed" on public.lodge_feed_items
for select using (active and public.member_matches_lodge_audience(lodge_id,audience));

drop policy if exists "members read lodge learning" on public.lodge_learning_items;
create policy "members read lodge learning" on public.lodge_learning_items
for select using (published and public.member_matches_lodge_audience(lodge_id,audience));

drop policy if exists "members read learning materials" on public.lodge_learning_materials;
create policy "members read learning materials" on public.lodge_learning_materials
for select using (
  exists(
    select 1 from public.lodge_learning_items i
    where i.id=learning_item_id
      and i.published
      and public.member_matches_lodge_audience(i.lodge_id,i.audience)
  )
);

drop policy if exists "lodge members read learning files" on storage.objects;
create policy "lodge members read learning files" on storage.objects for select to authenticated
using (
  bucket_id='lodge-learning'
  and exists(
    select 1
    from public.lodge_learning_materials m
    join public.lodge_learning_items i on i.id=m.learning_item_id
    where m.storage_path=name
      and i.published
      and public.member_matches_lodge_audience(i.lodge_id,i.audience)
  )
);

commit;
