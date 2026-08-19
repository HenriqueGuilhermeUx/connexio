begin;

create or replace function public.cleanup_event_storage()
returns trigger
language plpgsql
security definer
set search_path = public, storage, pg_temp
as $$
begin
  if old.image_path is not null then
    delete from storage.objects
    where bucket_id = 'event-images'
      and name = old.image_path;
  end if;
  return old;
end;
$$;

drop trigger if exists events_cleanup_storage on public.events;
create trigger events_cleanup_storage
before delete on public.events
for each row execute function public.cleanup_event_storage();

commit;
