# Configuração do Supabase sem terminal

## 1. Migrations já executadas

As migrations abaixo devem ser executadas uma única vez, em ordem:

1. `20260721170000_access_foundation.sql`;
2. `20260721190000_full_onboarding.sql`.

Quando o SQL Editor mostra **No rows detected** sem erro em vermelho, os comandos estruturais foram concluídos normalmente.

## 2. Executar as migrations finais desta entrega

Execute, nesta ordem:

1. `supabase/migrations/20260721210000_catalog_storage_admin.sql`;
2. `supabase/migrations/20260721230000_store_compliance.sql`.

Para cada arquivo:

1. selecione a branch `agent/supabase-foundation` no GitHub;
2. abra `supabase` → `migrations`;
3. abra o arquivo;
4. clique em **Raw** e copie tudo;
5. no Supabase, abra **SQL Editor** → **New query**;
6. cole e clique em **Run** uma vez.

A primeira cria o catálogo persistente, imagens privadas e filas administrativas. A segunda adiciona aceite versionado, denúncias, recuperação operacional, exclusão real da conta e moderação de denúncias.

## 3. Permitir entrada imediata no piloto

1. No Supabase, abra **Authentication**.
2. Entre em **Providers**.
3. Abra **Email**.
4. Mantenha o provedor habilitado.
5. Desative temporariamente **Confirm email**.
6. Salve.

## 4. Configurar URLs de autenticação

Em **Authentication** → **URL Configuration**:

- mantenha a URL local ou do piloto como `Site URL`;
- adicione em `Redirect URLs`:
  - `connexio://reset-password`;
  - a futura URL web do piloto seguida de `/reset-password`.

Depois que o EAS Hosting gerar o endereço, volte a esta tela e cadastre a URL completa de recuperação.

## 5. Criar e liberar o administrador fundador

1. Abra o Connexio na branch `agent/supabase-foundation`.
2. Crie a conta usando `henriquecampos66@gmail.com`.
3. No GitHub, abra `supabase/setup/bootstrap_owner.sql`.
4. Clique em **Raw** e copie tudo.
5. No Supabase, abra **SQL Editor** → **New query**.
6. Cole e clique em **Run** uma vez.

Resultado esperado:

- `status = APPROVED`;
- `is_admin = true`.

## 6. Teste operacional

Depois do bootstrap:

1. saia e entre novamente;
2. confirme o selo `MEMBRO VERIFICADO` no Perfil;
3. confirme o botão do painel administrativo;
4. publique uma oferta completa com foto;
5. aprove e publique a oferta no painel;
6. crie uma segunda conta;
7. confirme a visão limitada e o bloqueio dos contatos;
8. aprove a segunda conta;
9. denuncie uma oferta e trate a denúncia no painel;
10. teste recuperação de senha e exclusão com uma conta descartável.

## 7. Aviso por e-mail — adiado

A função preparada está em `supabase/functions/notify-new-member/index.ts`.

Secrets necessários futuramente:

- `RESEND_API_KEY`;
- `ADMIN_NOTIFICATION_EMAIL=henriquecampos66@gmail.com`;
- `MAIL_FROM`;
- `CONNEXIO_WEBHOOK_SECRET`.

## 8. Regra de chaves

O aplicativo usa somente:

- `EXPO_PUBLIC_SUPABASE_URL`;
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

Nunca coloque `service_role`, secret key, senha do banco ou chave do Resend no aplicativo, no GitHub ou em mensagens.
