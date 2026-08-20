begin;

create policy "lodge managers read event attendance"
on public.lodge_event_attendees
for select
using (
  member_id = auth.uid()
  or exists (
    select 1
    from public.lodge_events e
    where e.id = event_id
      and public.can_manage_lodge(e.lodge_id)
  )
);

commit;
