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
14. `20260819215500_gestor_pro_activation.sql`
15. `20260819220000_enforce_gestor_pro.sql`
16. `20260819221000_pro_task_engine_guard.sql`

A ponte reaproveita usuários e Admin do domínio anterior quando `profiles`/`app_admins` existirem. Não recriar a conta fundadora.

As três últimas migrations criam a solicitação/ativação comercial do Pro e fazem o backend — não apenas a interface — exigir `lodges.plan = 'PRO'` nos módulos avançados.

## 2. Edge Function de push

Implantar `supabase/functions/send-lodge-push/index.ts`.

A função recebe `announcement_id`, valida a gestão da Loja, busca membros/tokens apenas no servidor e envia o comunicado pela API de Push do Expo sem expor tokens ao cliente. O `service_role` permanece exclusivamente no ambiente da Edge Function.

## 3. Variáveis públicas

No app/Netlify usar somente:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_APP_URL`

Defina `EXPO_PUBLIC_APP_URL` após criar a URL definitiva no Netlify. Nunca colocar `service_role`, senha do banco, keystore ou outros secrets no app/Netlify.

## 4. Netlify

Conectar o site ao mesmo repositório Connexio. O repo já define build `npm run build:web`, diretório `dist`, Node 20 e fallback SPA. Depois do primeiro deploy, configure `EXPO_PUBLIC_APP_URL` e refaça o deploy para o QR apontar à validação Web real.

## 5. Testes funcionais obrigatórios

### Identidade/Admin
1. login real; 2. aprovação de membro; 3. Admin visível só para Admin; 4. solicitação de gestão com documento; 5. URL assinada; 6. aprovação de gestor e credencial.

### Gestor Free
7. carteirinha/QR; 8. convite de membro; 9. comunicado + push; 10. agenda/evento; 11. votação simples; 12. sessão; 13. leitura do QR pela câmera e presença.

### Gestor Pro
14. confirmar que Loja FREE não acessa Pro nem por rota/API; 15. solicitar Pro; 16. aprovar em `/admin-pro`; 17. confirmar `lodges.plan = PRO`; 18. Hoje na Loja; 19. Semáforo; 20. acompanhamento; 21. candidatos/sindicância; 22. educação; 23. planejamento; 24. ata; 25. transição; 26. tesouraria; 27. cobrança; 28. obrigação/documentos.

### Web
29. repetir fluxo Gestor no desktop; 30. abrir rota profunda; 31. validar QR por URL Web; 32. confirmar isolamento de documentos e módulos Pro.

## 6. Release Android

Antes do AAB:
```bash
npm run assets
npm run validate:release
npm run typecheck
npm run build:web
```

Depois execute `.github/workflows/android-build.yml` na branch candidata com `build_type=play-store`. O gate valida versão `0.4.0`, package oficial, EAS project, certificado de upload e launcher aprovado.

O EAS usa versionamento remoto + autoIncrement. Como a versão anterior aprovada tinha `versionCode 5`, confirme no artefato/Play Console que a nova release recebeu `versionCode 6` ou superior.

## 7. Regra de publicação

Manter o PR draft e o `main` intacto até migrations aplicadas, Edge Function implantada, CI verde, preview Web testado, Android real testado, AAB auditado e Play Console aceitar o artifact.
