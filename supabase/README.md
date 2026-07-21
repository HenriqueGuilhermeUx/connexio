# Configuração do Supabase sem terminal

## 1. Migration inicial — concluída

A migration `20260721170000_access_foundation.sql` cria perfis, validação privada de CIM, categorias, ofertas, contatos, favoritos, administração, auditoria e políticas RLS.

Quando o SQL Editor mostra **No rows detected** sem erro em vermelho, a execução de comandos de estrutura foi concluída normalmente: essas instruções não retornam linhas.

## 2. Executar a migration incremental

Como o modelo de onboarding evoluiu, execute também:

`supabase/migrations/20260721190000_full_onboarding.sql`

Passos:

1. No GitHub, abra o repositório `connexio`.
2. Selecione a branch `agent/supabase-foundation`.
3. Abra `supabase` → `migrations`.
4. Abra `20260721190000_full_onboarding.sql`.
5. Clique em **Raw** e copie tudo.
6. No Supabase, abra **SQL Editor** → **New query**.
7. Cole e clique em **Run** uma vez.

Essa migration:

- preserva todos os dados preenchidos pelo membro pendente;
- mantém a oferta privada até aprovação;
- permite registrar contatos próprios sem revelá-los a terceiros;
- amplia os segmentos;
- cria a fila auditável de notificações administrativas;
- registra perfil e CIM automaticamente durante o cadastro do Auth.

## 3. Permitir entrada imediata no piloto

1. No Supabase, abra **Authentication**.
2. Entre em **Providers**.
3. Abra **Email**.
4. Mantenha o provedor habilitado.
5. Desative temporariamente **Confirm email**.
6. Salve.

A confirmação de e-mail pode voltar antes da abertura pública. A migration incremental já permite criar a solicitação de validação mesmo quando não há sessão imediata.

## 4. Criar o primeiro administrador

Primeiro, crie sua conta pelo Connexio. Depois:

1. Abra **SQL Editor**.
2. Crie uma consulta.
3. Substitua o e-mail abaixo pelo e-mail da sua conta.
4. Clique em **Run**.

```sql
insert into public.app_admins (user_id)
select id from public.profiles where email = 'SEU_EMAIL_AQUI'
on conflict (user_id) do nothing;
```

## 5. Aviso por e-mail de novo cadastro

A função está em:

`supabase/functions/notify-new-member/index.ts`

Ela usa Resend, conforme o exemplo oficial de envio de e-mails em Supabase Edge Functions.

### Secrets necessários

No Supabase, abra **Edge Functions** → **Secrets** e adicione:

- `RESEND_API_KEY`;
- `ADMIN_NOTIFICATION_EMAIL`;
- `MAIL_FROM` — no piloto pode ser `Connexio <onboarding@resend.dev>`;
- `CONNEXIO_WEBHOOK_SECRET` — uma senha longa criada somente para o webhook.

Os secrets `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` já são disponibilizados pelo ambiente hospedado da Edge Function.

### Webhook

Depois de publicar a função:

1. Abra **Database** → **Webhooks**.
2. Crie `notify-new-member`.
3. Tabela: `admin_notification_outbox`.
4. Evento: `INSERT`.
5. Método: `POST`.
6. URL: endereço da Edge Function `notify-new-member`.
7. Header: `x-webhook-secret` com o mesmo valor de `CONNEXIO_WEBHOOK_SECRET`.

O e-mail será enviado uma vez por cadastro, e o evento ficará marcado como `SENT` ou `FAILED`.

## 6. Regra de chaves

O aplicativo usa somente:

- `EXPO_PUBLIC_SUPABASE_URL`;
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

Nunca coloque `service_role`, secret key, senha do banco ou chave do Resend no aplicativo, no GitHub ou em mensagens.
