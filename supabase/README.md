# Configuração do Supabase sem terminal

## 1. Migrations já executadas

As migrations abaixo devem ser executadas uma única vez, em ordem:

1. `20260721170000_access_foundation.sql`;
2. `20260721190000_full_onboarding.sql`.

Quando o SQL Editor mostra **No rows detected** sem erro em vermelho, os comandos estruturais foram concluídos normalmente.

## 2. Executar a migration do catálogo real

Execute agora:

`supabase/migrations/20260721210000_catalog_storage_admin.sql`

Passos:

1. No GitHub, abra o repositório `connexio`.
2. Selecione a branch `agent/supabase-foundation`.
3. Abra `supabase` → `migrations`.
4. Abra `20260721210000_catalog_storage_admin.sql`.
5. Clique em **Raw** e copie tudo.
6. No Supabase, abra **SQL Editor** → **New query**.
7. Cole e clique em **Run** uma vez.

Ela cria:

- tabela e políticas de imagens das ofertas;
- bucket privado `listing-images`;
- leitura segura das imagens por status do membro;
- filas reais de membros e ofertas para o painel administrativo;
- permissões para upload, ordenação e exclusão de imagens.

## 3. Permitir entrada imediata no piloto

1. No Supabase, abra **Authentication**.
2. Entre em **Providers**.
3. Abra **Email**.
4. Mantenha o provedor habilitado.
5. Desative temporariamente **Confirm email**.
6. Salve.

A confirmação de e-mail poderá voltar antes da abertura pública.

## 4. Criar e liberar o administrador fundador

1. Abra o Connexio na branch `agent/supabase-foundation`.
2. Crie a conta usando `henriquecampos66@gmail.com`.
3. No GitHub, abra `supabase/setup/bootstrap_owner.sql`.
4. Clique em **Raw** e copie tudo.
5. No Supabase, abra **SQL Editor** → **New query**.
6. Cole e clique em **Run** uma vez.

O resultado esperado é uma linha com:

- `status = APPROVED`;
- `is_admin = true`.

O script não cria usuário nem senha. Ele apenas promove a conta já criada e vinculada ao e-mail correto.

## 5. Teste operacional

Depois do bootstrap:

1. saia e entre novamente no Connexio;
2. abra **Perfil**;
3. confirme o selo `MEMBRO VERIFICADO`;
4. confirme o botão **Abrir painel administrativo**;
5. publique uma oferta completa com foto;
6. abra o painel e publique a oferta;
7. crie uma segunda conta para testar a fila de validação e o catálogo limitado.

## 6. Aviso por e-mail de novo cadastro — pode ser feito depois

A função está em:

`supabase/functions/notify-new-member/index.ts`

Secrets necessários:

- `RESEND_API_KEY`;
- `ADMIN_NOTIFICATION_EMAIL=henriquecampos66@gmail.com`;
- `MAIL_FROM`;
- `CONNEXIO_WEBHOOK_SECRET`.

Depois de publicar a função, crie um Database Webhook na tabela `admin_notification_outbox`, evento `INSERT`, enviando o header `x-webhook-secret`.

## 7. Regra de chaves

O aplicativo usa somente:

- `EXPO_PUBLIC_SUPABASE_URL`;
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

Nunca coloque `service_role`, secret key, senha do banco ou chave do Resend no aplicativo, no GitHub ou em mensagens.
