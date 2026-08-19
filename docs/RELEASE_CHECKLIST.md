# Checklist de publicação do Connexio

## Estratégia de lançamento

A publicação será feita em três etapas:

1. **Piloto web fechado**: validação rápida do onboarding, busca, oferta, eventos e aprovação.
2. **Distribuição interna mobile**: APK Android e TestFlight iOS para um grupo controlado.
3. **Lojas públicas**: Google Play e App Store após estabilidade, conteúdo inicial e documentos legais.

## Produto obrigatório antes do piloto

- [ ] migrations executadas em ordem;
- [ ] cadastro e login reais validados;
- [ ] sessão persistente validada;
- [ ] dados maçônicos e preferência de eventos salvos no perfil;
- [ ] catálogo lido do Supabase, sem dados mockados;
- [ ] publicação e edição de oferta persistidas;
- [ ] oferta pendente privada;
- [ ] contatos bloqueados para pendentes;
- [ ] mensagem personalizada do WhatsApp validada em Android e iPhone;
- [ ] bloqueio e desbloqueio de anunciantes validados;
- [ ] painel administrativo real;
- [ ] aprovação, rejeição e suspensão reais;
- [ ] e-mail de novo cadastro funcionando;
- [ ] catálogo inicial de prévia;
- [ ] tratamento de estados vazios e erros.

## Eventos

- [ ] executar `20260721235000_masonic_profile_events.sql`;
- [ ] executar `20260721235100_event_storage_cleanup.sql`;
- [ ] publicar a Edge Function `notify-region-event`;
- [ ] confirmar Secrets `RESEND_API_KEY`, `MAIL_FROM` e `CONNEXIO_WEBHOOK_SECRET`;
- [ ] usar domínio de envio verificado antes de enviar para membros reais;
- [ ] cadastrar evento com imagem, data, local e alcance;
- [ ] aprovar e rejeitar eventos pelo painel administrativo;
- [ ] confirmar destaque regional na página inicial;
- [ ] confirmar que somente usuários com consentimento recebem e-mail;
- [ ] confirmar que a preferência pode ser desativada no perfil;
- [ ] confirmar registro de envios e falhas em `event_email_deliveries`;
- [ ] testar data inexistente, data passada e campos obrigatórios;

## Produto obrigatório antes das lojas

- [ ] upload, ordenação e exclusão de imagens;
- [ ] favoritos persistentes;
- [ ] denúncia e moderação de conteúdo;
- [ ] bloqueio de anunciantes e ocultação das ofertas;
- [ ] recuperação de senha;
- [ ] exclusão de conta, ofertas, eventos e imagens pelo aplicativo;
- [ ] página web para solicitar exclusão de conta;
- [ ] Termos de Uso;
- [ ] Política de Privacidade;
- [ ] canal de atendimento ao titular;
- [ ] consentimentos versionados;
- [ ] ícone, splash e identidade da loja;
- [ ] screenshots Android e iOS;
- [ ] descrição curta e longa atualizada com eventos;
- [ ] classificação etária e declarações de privacidade atualizadas;
- [ ] teste em aparelhos Android e iPhone reais;
- [ ] revisão de acessibilidade;
- [ ] revisão de segurança e RLS.

## Infraestrutura Expo

- [ ] criar ou confirmar conta Expo da Alternative Ventures;
- [ ] inicializar o projeto EAS e registrar `projectId`;
- [ ] conectar o repositório GitHub ao projeto Expo;
- [ ] cadastrar variáveis `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` nos ambientes preview e production;
- [ ] gerar primeiro build Android preview;
- [ ] gerar primeiro build iOS preview;
- [ ] configurar credenciais de assinatura;
- [ ] configurar EAS Hosting para o piloto web;
- [ ] manter builds automáticos somente após validação das migrations.

## Contas das lojas

- [ ] Google Play Console em nome da Alternative Ventures;
- [ ] Apple Developer Program em nome da Alternative Ventures;
- [ ] dados fiscais, telefone, e-mail e endereço verificados;
- [ ] usuários e permissões administrativas revisados;
- [ ] credenciais de submissão guardadas no EAS, nunca no GitHub.

## Identificadores definitivos

- Android package: `br.com.alternativeventures.connexio`
- iOS bundle identifier: `br.com.alternativeventures.connexio`
- Nome público: `Connexio`
- Desenvolvedor: `Alternative Ventures`
- CNPJ: `61.920.356/0001-38`

## Critério de liberação pública

O aplicativo só segue para produção pública quando:

- pelo menos 30 ofertas reais estiverem publicadas;
- houver cobertura inicial nas cidades escolhidas para o piloto;
- cadastro, aprovação, busca, contato e bloqueio tiverem sido testados de ponta a ponta;
- cadastro, aprovação, exibição regional e contato de eventos tiverem sido testados;
- o envio de e-mails estiver limitado a usuários que deram consentimento;
- não houver falhas críticas abertas;
- os documentos legais e a exclusão de conta estiverem disponíveis;
- a administração conseguir operar o produto sem editar diretamente o banco.
