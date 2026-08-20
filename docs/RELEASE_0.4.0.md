# Connexio 0.4.0 — Release Candidate

## Identidade imutável desta release

- App: Connexio
- Versão: `0.4.0`
- Android package: `br.com.alternativeventures.connexio`
- iOS bundle: `br.com.alternativeventures.connexio`
- Expo owner: `henrriquenexa`
- EAS project: `cdcb129b-043c-4823-be6f-4e7dc0b7ddeb`
- Último versionCode aprovado na Play antes desta versão: `5`
- Próximo versionCode esperado: `6` (EAS remote + autoIncrement; confirmar no artifact/Play)
- Certificado de upload SHA-1 esperado: `F7:6A:76:7A:3B:2E:C2:B1:B8:6E:C0:FE:0F:4C:66:0A:21:10:BC:A0`
- Launcher extraído do AAB deve manter SHA-256: `2dead15b728e96074c7050b6c77932c0730a94d12f5db8a14ea0e61b087d8e24`

O workflow `.github/workflows/android-build.yml` bloqueia o AAB Play se package, versão, certificado ou ícone divergirem.

## O que entra na 0.4.0

### Rede Connexio
- rede privada entre membros verificados;
- anúncios de produtos e serviços;
- busca, favoritos e contato;
- perfil e identidade do membro.

### Carteirinha digital
- vínculo com Loja;
- token opaco e revogável;
- QR Code;
- validação web/app sem expor e-mail, telefone ou CIM completo.

### Gestor Free
- membros/cargos e convites;
- comunicados e push;
- agenda/eventos;
- votações simples;
- sessões e frequência;
- check-in pela câmera usando QR da carteirinha.

### Gestor Pro — R$ 49,90/mês por Loja
- solicitação de ativação pela Loja e decisão no Admin Connexio;
- entitlement protegido também por RLS no backend;
- Hoje na Loja com ações automáticas;
- Semáforo;
- acompanhamento fraternal e liderança;
- candidatos/sindicâncias;
- educação/formação;
- planejamento, metas e projetos;
- atas;
- transição de gestão;
- cobranças/mensalidades;
- tesouraria, baixas e recorrências;
- obrigações/vencimentos;
- documentos privados;
- arquitetura para futura gestão por voz.

## Antes de gerar o AAB final

1. Aplicar no Supabase todas as migrations de `20260819170000` até `20260819221000`, em ordem cronológica.
2. Implantar a Edge Function `send-lodge-push`.
3. Confirmar o Admin fundador após a migration de ponte.
4. Testar login, aprovação de membro e aprovação de gestor.
5. Testar comprovação do gestor via storage/URL assinada.
6. Testar Loja, cargo e credencial.
7. Testar QR e validação.
8. Testar câmera de frequência em Android real.
9. Testar push em development/release build Android.
10. Testar Gestor Free integralmente.
11. Confirmar que uma Loja FREE não acessa módulos Pro nem diretamente pela API.
12. Solicitar Gestor Pro, aprovar em `/admin-pro` e confirmar `lodges.plan = PRO`.
13. Testar todos os módulos Pro/SOL.
14. Publicar Web no Netlify e definir `EXPO_PUBLIC_APP_URL`.
15. Revalidar CI (release identity + TypeScript + export Web).
16. Executar workflow Android com `build_type=play-store`.
17. Confirmar `release-audit.txt` com `Result: PASS`.
18. Confirmar no Google Play Console o versionCode `6` ou superior e o certificado de upload esperado.

## Notas da versão para Google Play — pt-BR

> O Connexio evoluiu para apoiar também a rotina das Lojas. Esta versão adiciona carteirinha digital com QR verificável, gestão de membros, comunicados, agenda, votações simples, sessões e frequência, além do novo Connexio Gestor com ferramentas para planejamento, acompanhamento, formação, tesouraria, cobranças, obrigações, atas e continuidade administrativa.

## Fora desta release

- votação formal/eleitoral;
- processo disciplinar formal;
- Pix automático com provedor financeiro real;
- cobrança recorrente automática da assinatura Pro dentro do app;
- execução por voz em produção.

O Pro 0.4.0 usa solicitação e ativação administrativa inicial; não apresentar como assinatura automática integrada.
