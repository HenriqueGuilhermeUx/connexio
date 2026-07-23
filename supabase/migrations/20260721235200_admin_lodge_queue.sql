begin;

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
  p.lodge_name,
  p.lodge_number,
  p.obedience,
  p.event_email_opt_in,
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
  p.lodge_name,
  p.lodge_number,
  p.obedience,
  p.event_email_opt_in,
  p.status,
  p.created_at,
  mv.cim_number,
  mv.cim_last4,
  mv.submitted_at,
  mv.reviewed_at,
  mv.decision_reason;

grant select on public.admin_member_queue to authenticated;

commit;
