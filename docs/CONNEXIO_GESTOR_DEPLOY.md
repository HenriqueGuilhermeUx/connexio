# Connexio Gestor — ativação do backend e Web

## O que NÃO criar

- Não criar outro repositório para Web.
- Não criar outro projeto Supabase se o projeto histórico do Connexio ainda estiver ativo.
- Android e Web usam a mesma base `HenriqueGuilhermeUx/connexio`.

## 1. Supabase existente

Aplicar as migrations novas na ordem cronológica:

1. `20260819170000_connexio_gestor.sql`
2. `20260819173000_member_identity.sql`
3. `20260819174500_admin_workflows.sql`
4. `20260819175500_lodge_member_visibility.sql`
5. `20260819180000_event_manager_visibility.sql`
6. `20260819181500_lodge_invitations.sql`
7. `20260819183000_lodge_obligations.sql`
8. `20260819184500_member_credential_verification.sql`
9. `20260819190000_bridge_existing_connexio.sql`
10. `20260819191000_sync_legacy_member_approval.sql`

A migration de ponte copia usuários e administradores do domínio antigo quando `profiles`/`app_admins` existirem. Em instalação limpa ela é segura e não faz nada.

## 2. Variáveis públicas do app

Configurar apenas estas variáveis:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_APP_URL`

Nunca expor `service_role`, secret key ou senha do banco no app ou no Netlify.

## 3. Netlify

Conectar o site ao mesmo repositório do Connexio.

O repo já define:

- comando: `npm run build:web`
- diretório: `dist`
- redirects SPA em `netlify.toml`

Depois que o Netlify fornecer a URL definitiva, defini-la como `EXPO_PUBLIC_APP_URL` para que o QR da carteirinha gere uma URL Web verificável.

## 4. Supabase Auth

No projeto existente:

- manter Email habilitado;
- configurar a URL Web definitiva como Site URL/Redirect URL quando necessário;
- manter `connexio://` nas URLs de deep link mobile usadas pelo app.

## 5. Teste mínimo antes do merge

1. criar/login de membro;
2. aprovar membro no Admin;
3. solicitar gestão da Loja com documento;
4. abrir documento por URL assinada;
5. aprovar gestor;
6. confirmar criação de Loja + membership + credencial;
7. abrir carteirinha e validar QR;
8. convidar segundo membro por e-mail;
9. criar comunicado, evento e votação simples;
10. criar conta a pagar/receber com comprovante;
11. criar obrigação/vencimento;
12. gerar cobrança;
13. testar as mesmas rotinas em Android e Web.

## 6. Regra de release

Manter o PR em draft até:

- migrations aplicadas no Supabase real;
- CI verde;
- Web publicada em preview/Netlify;
- fluxo crítico testado;
- `main` preservado até a aprovação final da nova versão.
