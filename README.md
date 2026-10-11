# Connexio

**Confiança que gera negócios. Gestão que fortalece a Loja.**

Connexio é uma rede privada para membros verificados, com marketplace de produtos/serviços e um Sistema Operacional da Loja (SOL) para apoiar Venerável, Secretário e Tesoureiro.

## Release candidata

Versão atual desta branch: **0.4.0**.

### Rede do membro

- autenticação e verificação;
- feed de produtos e serviços;
- busca, favoritos e contato;
- publicação de ofertas;
- carteirinha digital com QR verificável e revogável.

### Gestor Free

- membros e cargos;
- comunicados e push;
- agenda/eventos;
- votações simples;
- sessões e frequência;
- check-in por câmera usando a carteirinha Connexio.

### Gestor Pro — R$ 49,90/mês por Loja

- Hoje na Loja com tarefas automáticas;
- Semáforo da Loja;
- acompanhamento dos irmãos e formação de lideranças;
- candidatos e sindicâncias estruturadas;
- educação e trilhas de formação;
- planejamento anual, metas e projetos;
- atas estruturadas;
- transição de gestão;
- cobranças/mensalidades;
- tesouraria, contas a pagar/receber e baixas;
- obrigações, vencimentos e documentos privados;
- contratos de ação preparados para futura gestão por voz.

## Stack

- Expo SDK 54;
- React Native 0.81 / React 19;
- Expo Router;
- TypeScript;
- Supabase Auth, Postgres, RLS, Storage e Edge Functions;
- Expo Camera;
- Expo Notifications;
- Android + Web na mesma base;
- Netlify para Web;
- EAS/GitHub Actions para Android.

## Segurança

- CIM completo não é exposto publicamente;
- QR usa token opaco e revogável;
- documentos de gestão ficam em buckets privados;
- URLs de documentos são temporárias;
- RLS isola Lojas e papéis;
- notas de acompanhamento e candidatos ficam restritos à gestão;
- Admin Connexio é separado da administração das Lojas.

## Desenvolvimento

```bash
npm install
npm run start
```

O comando prepara os assets oficiais antes de iniciar o Expo.

Validação da release:

```bash
npm run assets
npm run validate:release
npm run typecheck
npm run build:web
```

## Web / Netlify

`netlify.toml` já define:

- build: `npm run build:web`;
- publish: `dist`;
- fallback SPA para rotas do Expo Router.

## Android / Google Play

O workflow `.github/workflows/android-build.yml` gera APK de teste ou AAB Play Store e valida:

- package `br.com.alternativeventures.connexio`;
- versão 0.4.0;
- chave de upload autorizada;
- launcher aprovado;
- TypeScript;
- origem exata do código selecionado no workflow.

Consulte [`docs/RELEASE_0.4.0.md`](docs/RELEASE_0.4.0.md) antes de gerar o AAB final.

## Backend

As migrations em `supabase/migrations/` evoluem o projeto Supabase histórico sem recriar usuários/Admin. Antes da publicação da 0.4.0, aplique as migrations novas em ordem e implante `supabase/functions/send-lodge-push`.

## Fora do escopo desta release

- votação formal/eleitoral;
- processo disciplinar formal;
- Pix automático com provedor financeiro;
- assinatura Pro cobrada automaticamente dentro do app;
- execução por voz em produção.
