begin;

-- Central privada da Loja: conteúdo publicado pelos gestores para os membros.
create table if not exists public.lodge_feed_items (
  id uuid primary key default gen_random_uuid(),
  lodge_id uuid not null references public.lodges(id) on delete cascade,
  item_type text not null check (item_type in ('ANNOUNCEMENT','SESSION','MINUTES','PLAN','LEARNING','DOCUMENT')),
  title text not null,
  summary text,
  source_entity_id text,
  audience text not null default 'ALL' check (audience in ('ALL','APPRENTICE','COMPANION','MASTER','LEADERSHIP')),
  published_by uuid not null references auth.users(id),
  published_at timestamptz not null default now(),
  active boolean not null default true
);

create index if not exists lodge_feed_items_lodge_date_idx on public.lodge_feed_items(lodge_id,published_at desc);

-- Biblioteca institucional da Loja.
create table if not exists public.lodge_documents (
  id uuid primary key default gen_random_uuid(),
  lodge_id uuid not null references public.lodges(id) on delete cascade,
  title text not null,
  category text not null default 'OTHER' check (category in ('POSSESSION','MINUTES','CONSTITUTION','REGULATION','CIRCULAR','FINANCE','EDUCATION','OTHER')),
  description text,
  file_name text not null,
  storage_path text not null,
  mime_type text,
  visibility text not null default 'MEMBERS' check (visibility in ('MEMBERS','MANAGERS')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lodge_documents_lodge_category_idx on public.lodge_documents(lodge_id,category,created_at desc);

-- Materiais anexos às trilhas de educação.
create table if not exists public.lodge_learning_materials (
  id uuid primary key default gen_random_uuid(),
  learning_item_id uuid not null references public.lodge_learning_items(id) on delete cascade,
  lodge_id uuid not null references public.lodges(id) on delete cascade,
  title text not null,
  file_name text not null,
  storage_path text not null,
  mime_type text,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.lodge_learning_items add column if not exists published boolean not null default false;
alter table public.lodge_learning_items add column if not exists published_at timestamptz;

-- Woovi / Pix: campos de conciliação nas cobranças dos membros.
alter table public.lodge_charges add column if not exists correlation_id text;
alter table public.lodge_charges add column if not exists qr_code_image_url text;
alter table public.lodge_charges add column if not exists payment_link_url text;
create unique index if not exists lodge_charges_correlation_id_idx on public.lodge_charges(correlation_id) where correlation_id is not null;

-- Checkout Web do Gestor Pro. No Android Play o faturamento deve respeitar Play Billing.
alter table public.lodge_plan_requests add column if not exists payment_provider text;
alter table public.lodge_plan_requests add column if not exists payment_correlation_id text;
alter table public.lodge_plan_requests add column if not exists payment_reference text;
alter table public.lodge_plan_requests add column if not exists pix_copy_paste text;
alter table public.lodge_plan_requests add column if not exists payment_link_url text;
alter table public.lodge_plan_requests add column if not exists payment_status text not null default 'NOT_CREATED' check (payment_status in ('NOT_CREATED','PENDING','PAID','EXPIRED','FAILED'));
create unique index if not exists lodge_plan_requests_payment_correlation_idx on public.lodge_plan_requests(payment_correlation_id) where payment_correlation_id is not null;

alter table public.lodge_feed_items enable row level security;
alter table public.lodge_documents enable row level security;
alter table public.lodge_learning_materials enable row level security;

-- Feed: todos os membros ativos leem; gestores publicam.
drop policy if exists "members read lodge feed" on public.lodge_feed_items;
create policy "members read lodge feed" on public.lodge_feed_items for select using (public.is_lodge_member(lodge_id));
drop policy if exists "managers manage lodge feed" on public.lodge_feed_items;
create policy "managers manage lodge feed" on public.lodge_feed_items for all using (public.can_manage_lodge(lodge_id)) with check (public.can_manage_lodge(lodge_id));

-- Documentos: membros leem os compartilhados; gestores leem tudo e administram.
drop policy if exists "members read shared lodge documents" on public.lodge_documents;
create policy "members read shared lodge documents" on public.lodge_documents for select using (public.is_lodge_member(lodge_id) and (visibility='MEMBERS' or public.can_manage_lodge(lodge_id)));
drop policy if exists "managers manage lodge documents" on public.lodge_documents;
create policy "managers manage lodge documents" on public.lodge_documents for all using (public.can_manage_lodge(lodge_id)) with check (public.can_manage_lodge(lodge_id));

-- Materiais educacionais: membros da Loja leem quando a trilha estiver publicada.
drop policy if exists "members read learning materials" on public.lodge_learning_materials;
create policy "members read learning materials" on public.lodge_learning_materials for select using (
  public.is_lodge_member(lodge_id) and exists(select 1 from public.lodge_learning_items i where i.id=learning_item_id and i.published)
);
drop policy if exists "managers manage learning materials" on public.lodge_learning_materials;
create policy "managers manage learning materials" on public.lodge_learning_materials for all using (public.can_use_lodge_pro(lodge_id)) with check (public.can_use_lodge_pro(lodge_id));

-- O próprio membro pode atualizar seu progresso; gestores continuam podendo administrar.
drop policy if exists "members update own learning progress" on public.lodge_learning_progress;
create policy "members update own learning progress" on public.lodge_learning_progress for update using (member_id=auth.uid()) with check (member_id=auth.uid());
drop policy if exists "members create own learning progress" on public.lodge_learning_progress;
create policy "members create own learning progress" on public.lodge_learning_progress for insert with check (member_id=auth.uid());

insert into storage.buckets(id,name,public) values ('lodge-documents','lodge-documents',false)
on conflict(id) do update set public=false;
insert into storage.buckets(id,name,public) values ('lodge-learning','lodge-learning',false)
on conflict(id) do update set public=false;

-- Storage da biblioteca. Caminho: <lodge_id>/<uuid>-arquivo.ext
create policy "lodge members read shared document files" on storage.objects for select to authenticated
using (
  bucket_id='lodge-documents' and exists(
    select 1 from public.lodge_documents d
    where d.storage_path=name
      and d.lodge_id=((storage.foldername(name))[1])::uuid
      and public.is_lodge_member(d.lodge_id)
      and (d.visibility='MEMBERS' or public.can_manage_lodge(d.lodge_id))
  )
);
create policy "lodge managers upload document files" on storage.objects for insert to authenticated
with check (bucket_id='lodge-documents' and public.can_manage_lodge(((storage.foldername(name))[1])::uuid));
create policy "lodge managers manage document files" on storage.objects for update to authenticated
using (bucket_id='lodge-documents' and public.can_manage_lodge(((storage.foldername(name))[1])::uuid));
create policy "lodge managers delete document files" on storage.objects for delete to authenticated
using (bucket_id='lodge-documents' and public.can_manage_lodge(((storage.foldername(name))[1])::uuid));

-- Storage educacional. Caminho: <lodge_id>/<learning_id>/<uuid>-arquivo.ext
create policy "lodge members read learning files" on storage.objects for select to authenticated
using (
  bucket_id='lodge-learning' and public.is_lodge_member(((storage.foldername(name))[1])::uuid)
);
create policy "pro managers upload learning files" on storage.objects for insert to authenticated
with check (bucket_id='lodge-learning' and public.can_use_lodge_pro(((storage.foldername(name))[1])::uuid));
create policy "pro managers delete learning files" on storage.objects for delete to authenticated
using (bucket_id='lodge-learning' and public.can_use_lodge_pro(((storage.foldername(name))[1])::uuid));

create or replace function public.publish_learning_item(target_item uuid)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare item public.lodge_learning_items%rowtype;
begin
  select * into item from public.lodge_learning_items where id=target_item;
  if item.id is null then raise exception 'Formação não encontrada'; end if;
  if not public.can_use_lodge_pro(item.lodge_id) then raise exception 'Gestor Pro necessário'; end if;
  update public.lodge_learning_items set published=true,published_at=now(),updated_at=now() where id=target_item;
  insert into public.lodge_feed_items(lodge_id,item_type,title,summary,source_entity_id,audience,published_by)
  values(item.lodge_id,'LEARNING',item.title,item.description,item.id::text,item.audience,auth.uid());
end;$$;
grant execute on function public.publish_learning_item(uuid) to authenticated;

create or replace function public.publish_lodge_item(target_lodge uuid,target_type text,target_title text,target_summary text default null,target_source text default null,target_audience text default 'ALL')
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare new_id uuid;
begin
  if not public.can_manage_lodge(target_lodge) then raise exception 'Acesso de gestão necessário'; end if;
  if target_type not in ('ANNOUNCEMENT','SESSION','MINUTES','PLAN','LEARNING','DOCUMENT') then raise exception 'Tipo inválido'; end if;
  insert into public.lodge_feed_items(lodge_id,item_type,title,summary,source_entity_id,audience,published_by)
  values(target_lodge,target_type,target_title,target_summary,target_source,coalesce(target_audience,'ALL'),auth.uid()) returning id into new_id;
  return new_id;
end;$$;
grant execute on function public.publish_lodge_item(uuid,text,text,text,text,text) to authenticated;

commit;
