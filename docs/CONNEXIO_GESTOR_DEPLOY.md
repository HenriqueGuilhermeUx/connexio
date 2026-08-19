# Connexio Gestor 0.4.0 — ativação do backend e Web

## O que não criar

- Não criar outro repositório para Web.
- Não criar outro projeto Supabase se o projeto histórico do Connexio ainda estiver ativo.
- Android e Web usam a mesma base `HenriqueGuilhermeUx/connexio`.

## 1. Supabase existente

Aplicar as migrations novas **uma única vez e na ordem cronológica**:

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
11. `20260819210000_sol_core.sql`
12. `20260819213000_sol_people_candidates_education_transition.sql`
13. `20260819214500_push_notifications.sql`

A ponte reaproveita usuários e Admin do domínio anterior quando `profiles`/`app_admins` existirem. Não recriar a conta fundadora.

## 2. Edge Function de push

Implantar:

`supabase/functions/send-lodge-push/index.ts`

A função:

- recebe `announcement_id` autenticado;
- valida se o usuário pode gerir a Loja;
- busca membros ativos e tokens com `service_role` apenas no servidor;
- envia mensagens pela API do Expo Push;
- nunca devolve a lista de tokens ao cliente.

O `service_role` permanece exclusivamente no ambiente da Edge Function.

## 3. Variáveis públicas

No app/Netlify usar somente:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_APP_URL`

A URL e publishable key do projeto histórico já estão no perfil EAS. Defina `EXPO_PUBLIC_APP_URL` após criar a URL definitiva no Netlify.

Nunca colocar `service_role`, senha do banco, keystore ou secrets de provedor no app/Netlify.

## 4. Netlify

Conectar o site ao **mesmo repositório** Connexio.

Configuração já versionada:

- comando: `npm run build:web`
- diretório: `dist`
- Node 20;
- fallback SPA em `netlify.toml`.

Depois do primeiro deploy, configurar `EXPO_PUBLIC_APP_URL` e refazer o deploy. O QR da carteirinha passa a apontar para `/verify-credential?token=...` na URL real.

## 5. Supabase Auth

- manter Email habilitado;
- manter usuários existentes;
- adicionar URL Web definitiva em Site URL/Redirect URLs quando necessário;
- manter deep links `connexio://` usados pelo mobile.

## 6. Testes funcionais obrigatórios

### Identidade/Admin
1. login de usuário real;
2. aprovação de membro;
3. confirmar que somente Admin vê acesso administrativo;
4. solicitar gestão de Loja com PDF/imagem;
5. abrir documento por URL assinada;
6. aprovar gestor e confirmar Loja + cargo + credencial.

### Membro/Free
7. abrir carteirinha e validar QR;
8. convidar membro por e-mail;
9. criar comunicado;
10. registrar dispositivo Android e testar push;
11. criar agenda/evento;
12. criar votação simples;
13. criar sessão;
14. ler QR pela câmera e confirmar presença/frequência.

### Pro/SOL
15. abrir Hoje na Loja e atualizar tarefas automáticas;
16. validar Semáforo;
17. registrar acompanhamento de membro;
18. cadastrar candidato e concluir checklist de sindicância;
19. criar/semear trilha de educação;
20. criar plano, meta e projeto;
21. registrar ata;
22. gerar checklist de transição;
23. criar conta a pagar/receber e anexar documento;
24. dar baixa;
25. criar cobrança;
26. criar obrigação/vencimento.

### Web
27. repetir fluxo Gestor no desktop;
28. acessar rota profunda diretamente no navegador;
29. validar QR por URL Web;
30. confirmar que documentos privados continuam protegidos.

## 7. Release Android

Antes do AAB:

```bash
npm run assets
npm run validate:release
npm run typecheck
npm run build:web
```

Depois execute `.github/workflows/android-build.yml` na branch candidata com `build_type=play-store`.

O workflow deve bloquear divergências de:

- versão `0.4.0`;
- package `br.com.alternativeventures.connexio`;
- EAS project oficial;
- certificado de upload;
- launcher aprovado.

O EAS usa versionamento remoto + autoIncrement. Como a versão anterior aprovada tinha `versionCode 5`, confirme no artefato/Play Console que a nova release recebeu `versionCode 6` ou superior.

## 8. Regra de merge/publicação

Manter o PR draft e o `main` intacto até:

- migrations aplicadas sem erro;
- Edge Function implantada;
- CI verde;
- preview Web testado;
- Android real testado;
- AAB auditado;
- Play Console aceitar o artifact.
