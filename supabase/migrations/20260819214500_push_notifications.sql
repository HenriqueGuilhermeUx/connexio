begin;

create table if not exists public.device_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  expo_push_token text not null unique,
  platform text not null check (platform in ('android','ios')),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists device_push_tokens_user_idx on public.device_push_tokens(user_id, enabled);
alter table public.device_push_tokens enable row level security;

create policy "users manage own push tokens" on public.device_push_tokens
for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Tokens são privados: gestores disparam pelo Edge Function, nunca leem tokens pelo cliente.

commit;
