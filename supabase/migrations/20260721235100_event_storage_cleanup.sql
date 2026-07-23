begin;

create or replace function public.cleanup_profile_storage()
returns trigger
language plpgsql
security definer
set search_path = public, storage, pg_temp
as $$
begin
  delete from storage.objects
  where bucket_id = 'listing-images'
    and name like old.id::text || '/%';

  delete from storage.objects
  where bucket_id = 'event-images'
    and name like old.id::text || '/%';

  return old;
end;
$$;

commit;
