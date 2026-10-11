begin;

create table if not exists public.lodge_obligations (
  id uuid primary key default gen_random_uuid(),
  lodge_id uuid not null references public.lodges(id) on delete cascade,
  title text not null,
  description text,
  due_date date not null,
  responsible_role text not null default 'SECRETARY' check (responsible_role in ('SECRETARY','TREASURER','WORSHIPFUL_MASTER')),
  recurrence text not null default 'NONE' check (recurrence in ('NONE','MONTHLY','QUARTERLY','YEARLY')),
  reminder_days integer not null default 7 check (reminder_days >= 0 and reminder_days <= 365),
  status text not null default 'OPEN' check (status in ('OPEN','DONE','CANCELED')),
  completed_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lodge_obligations enable row level security;

create policy "managers manage obligations"
on public.lodge_obligations
for all
using (public.can_manage_lodge(lodge_id))
with check (public.can_manage_lodge(lodge_id));

commit;
