# Connexio 0.4.0 — Release Candidate

## Identidade imutável desta release

- App: Connexio
- Versão: `0.4.0`
- Android package: `br.com.alternativeventures.connexio`
- iOS bundle: `br.com.alternativeventures.connexio`
- Expo owner: `henrriquenexa`
- EAS project: `cdcb129b-043c-4823-be6f-4e7dc0b7ddeb`
- Último versionCode aprovado na Play antes desta versão: `5`
- Próximo versionCode esperado: `6` (EAS remote + autoIncrement)
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
- token de verificação opaco e revogável;
- QR Code;
- página web/app de validação sem expor e-mail, telefone ou CIM completo.

### Gestor Free
- membros e cargos;
- convites por e-mail;
- comunicados;
- push para membros da Loja;
- agenda e eventos;
- participantes;
- votações simples;
- sessões e frequência;
- check-in pela câmera usando QR da carteirinha.

### Gestor Pro — R$ 49,90/mês por Loja
- Hoje na Loja com geração automática de ações;
- Semáforo da Loja;
- acompanhamento fraternal dos membros;
- desenvolvimento de lideranças;
- candidatos e sindicâncias estruturadas;
- educação e trilhas de formação;
- planejamento anual, metas e projetos;
- atas estruturadas;
- transição de gestão;
- cobranças e mensalidades;
- contas a pagar e receber;
- baixas e recorrências;
- obrigações e vencimentos;
- documentos/comprovantes privados;
- arquitetura preparada para comandos por voz.

## Antes de gerar o AAB final

1. Aplicar no Supabase, em ordem, todas as migrations novas de `20260819170000` até `20260819214500`.
2. Implantar a Edge Function `send-lodge-push`.
3. Confirmar que o usuário fundador continua em `connexio_admins` após a migration de ponte.
4. Testar login real, aprovação de membro e aprovação de gestor.
5. Testar upload e abertura temporária da comprovação do gestor.
6. Testar criação de Loja e vínculo/cargo.
7. Testar carteirinha e validação do QR.
8. Testar câmera de presença em um dispositivo Android real.
9. Testar comunicado com push em um development/release build; push remoto não deve ser validado apenas no Expo Go.
10. Testar Free: membros, comunicado, agenda/evento, votação simples e sessão/frequência.
11. Testar Pro: Hoje, Semáforo, acompanhamento, candidato, educação, planejamento, ata, transição, tesouraria, cobrança e obrigação.
12. Publicar a Web no Netlify e definir `EXPO_PUBLIC_APP_URL` com a URL final.
13. Revalidar CI TypeScript + export Web.
14. Executar o workflow Android com `build_type=play-store` na branch candidata.
15. Confirmar no `release-audit.txt`: `Result: PASS`.
16. Confirmar no Google Play Console que o AAB foi aceito com versionCode `6` ou superior e com o certificado de upload esperado.

## Notas da versão para Google Play — pt-BR

> O Connexio evoluiu para apoiar também a rotina das Lojas. Esta versão adiciona carteirinha digital com QR verificável, gestão de membros, comunicados, agenda, votações simples, sessões e frequência, além do novo Connexio Gestor com ferramentas para planejamento, acompanhamento, tesouraria, cobranças, obrigações, atas, formação e continuidade administrativa.

## O que permanece fora desta release

- votação formal/eleitoral;
- processo disciplinar formal;
- cobrança Pix automática com provedor financeiro real;
- cobrança automática da assinatura Pro dentro do aplicativo;
- execução por voz em produção.

Esses itens exigem regras, integrações ou decisões comerciais adicionais e não devem ser apresentados como ativos na 0.4.0.
