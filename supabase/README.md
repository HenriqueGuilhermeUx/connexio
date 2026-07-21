# Configuração do Supabase sem terminal

## 1. Executar a migration

1. Abra o projeto `connexio-dev` no Supabase.
2. No menu lateral, entre em **SQL Editor**.
3. Clique em **New query**.
4. No GitHub, abra `supabase/migrations/20260721170000_access_foundation.sql` na branch `agent/supabase-foundation`.
5. Clique em **Raw** e copie todo o conteúdo.
6. Cole no SQL Editor.
7. Clique em **Run** uma única vez.

A migration cria perfis, validações de CIM, categorias, ofertas, contatos, favoritos, administração, auditoria, funções de aprovação e políticas RLS.

## 2. Permitir entrada imediata no piloto

Para o piloto fechado, a conta precisa receber sessão logo após o cadastro para conseguir registrar o CIM na tabela protegida.

1. No Supabase, abra **Authentication**.
2. Entre em **Providers**.
3. Abra **Email**.
4. Mantenha o provedor de e-mail habilitado.
5. Desative temporariamente **Confirm email**.
6. Salve.

Antes de uma abertura pública, essa decisão deve ser reavaliada. O fluxo futuro pode usar confirmação por e-mail com uma Edge Function para registrar a solicitação de validação.

## 3. Criar o primeiro administrador

Primeiro, crie sua conta normalmente pelo Connexio. Depois:

1. Abra **SQL Editor** no Supabase.
2. Crie uma nova consulta.
3. Substitua o e-mail no comando abaixo pelo e-mail da sua conta Connexio.
4. Clique em **Run**.

```sql
insert into public.app_admins (user_id)
select id from public.profiles where email = 'SEU_EMAIL_AQUI'
on conflict (user_id) do nothing;
```

A partir daí, o painel administrativo poderá aprovar membros e ofertas usando as funções auditadas da migration.

## 4. Regra de chaves

A aplicação usa apenas:

- `EXPO_PUBLIC_SUPABASE_URL`;
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

Nunca coloque `service_role`, secret key ou senha do banco no aplicativo, no GitHub ou em mensagens.
