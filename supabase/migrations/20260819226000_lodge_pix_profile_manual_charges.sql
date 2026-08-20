begin;

create table if not exists public.lodge_payment_profiles (
  lodge_id uuid primary key references public.lodges(id) on delete cascade,
  pix_key_type text not null default 'OTHER' check (pix_key_type in ('CPF','CNPJ','EMAIL','PHONE','RANDOM','OTHER')),
  pix_key text not null,
  beneficiary_name text not null,
  bank_name text,
  instructions text,
  qr_storage_path text,
  updated_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now()
);

alter table public.lodge_payment_profiles enable row level security;

drop policy if exists "members read lodge payment profile" on public.lodge_payment_profiles;
create policy "members read lodge payment profile" on public.lodge_payment_profiles
for select using (public.is_lodge_member(lodge_id));

drop policy if exists "pro managers manage lodge payment profile" on public.lodge_payment_profiles;
create policy "pro managers manage lodge payment profile" on public.lodge_payment_profiles
for all using (public.can_use_lodge_pro(lodge_id)) with check (public.can_use_lodge_pro(lodge_id));

insert into storage.buckets(id,name,public)
values ('lodge-payment-assets','lodge-payment-assets',false)
on conflict(id) do update set public=false;

drop policy if exists "lodge members read payment assets" on storage.objects;
create policy "lodge members read payment assets" on storage.objects
for select to authenticated
using (
  bucket_id='lodge-payment-assets'
  and public.is_lodge_member(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "pro managers upload payment assets" on storage.objects;
create policy "pro managers upload payment assets" on storage.objects
for insert to authenticated
with check (
  bucket_id='lodge-payment-assets'
  and public.can_use_lodge_pro(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "pro managers update payment assets" on storage.objects;
create policy "pro managers update payment assets" on storage.objects
for update to authenticated
using (
  bucket_id='lodge-payment-assets'
  and public.can_use_lodge_pro(((storage.foldername(name))[1])::uuid)
);

drop policy if exists "pro managers delete payment assets" on storage.objects;
create policy "pro managers delete payment assets" on storage.objects
for delete to authenticated
using (
  bucket_id='lodge-payment-assets'
  and public.can_use_lodge_pro(((storage.foldername(name))[1])::uuid)
);

create or replace function public.save_lodge_payment_profile(
  target_lodge uuid,
  target_key_type text,
  target_pix_key text,
  target_beneficiary text,
  target_bank_name text default null,
  target_instructions text default null,
  target_qr_path text default null
)
returns void
language plpgsql
security definer
set search_path=public,pg_temp
as $$
begin
  if not public.can_use_lodge_pro(target_lodge) then raise exception 'Gestor Pro necessário'; end if;
  if target_pix_key is null or length(trim(target_pix_key)) = 0 then raise exception 'Informe a chave Pix'; end if;
  if target_beneficiary is null or length(trim(target_beneficiary)) = 0 then raise exception 'Informe o favorecido'; end if;

  insert into public.lodge_payment_profiles(
    lodge_id,pix_key_type,pix_key,beneficiary_name,bank_name,instructions,qr_storage_path,updated_by,updated_at
  ) values (
    target_lodge,coalesce(target_key_type,'OTHER'),trim(target_pix_key),trim(target_beneficiary),
    nullif(trim(target_bank_name),''),nullif(trim(target_instructions),''),target_qr_path,auth.uid(),now()
  )
  on conflict(lodge_id) do update set
    pix_key_type=excluded.pix_key_type,
    pix_key=excluded.pix_key,
    beneficiary_name=excluded.beneficiary_name,
    bank_name=excluded.bank_name,
    instructions=excluded.instructions,
    qr_storage_path=coalesce(excluded.qr_storage_path,public.lodge_payment_profiles.qr_storage_path),
    updated_by=auth.uid(),
    updated_at=now();
end;$$;

grant execute on function public.save_lodge_payment_profile(uuid,text,text,text,text,text,text) to authenticated;

create or replace function public.mark_lodge_charge_paid(target_charge uuid)
returns void
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare target_lodge uuid;
begin
  select lodge_id into target_lodge from public.lodge_charges where id=target_charge;
  if target_lodge is null then raise exception 'Cobrança não encontrada'; end if;
  if not public.can_use_lodge_pro(target_lodge) then raise exception 'Gestor Pro necessário'; end if;
  update public.lodge_charges
  set status='PAID',paid_at=now(),provider='MANUAL_PIX',updated_at=now()
  where id=target_charge;
end;$$;

grant execute on function public.mark_lodge_charge_paid(uuid) to authenticated;

commit;
