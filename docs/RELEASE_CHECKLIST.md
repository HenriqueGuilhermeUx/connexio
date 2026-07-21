# Checklist de publicação do Connexio

## Estratégia de lançamento

A publicação será feita em três etapas:

1. **Piloto web fechado**: validação rápida do onboarding, busca, oferta e aprovação.
2. **Distribuição interna mobile**: APK Android e TestFlight iOS para um grupo controlado.
3. **Lojas públicas**: Google Play e App Store após estabilidade, conteúdo inicial e documentos legais.

## Produto obrigatório antes do piloto

- [ ] segunda migration aplicada;
- [ ] cadastro e login reais validados;
- [ ] sessão persistente validada;
- [ ] catálogo lido do Supabase, sem dados mockados;
- [ ] publicação e edição de oferta persistidas;
- [ ] oferta pendente privada;
- [ ] contatos bloqueados para pendentes;
- [ ] painel administrativo real;
- [ ] aprovação, rejeição e suspensão reais;
- [ ] e-mail de novo cadastro funcionando;
- [ ] catálogo inicial de prévia;
- [ ] tratamento de estados vazios e erros.

## Produto obrigatório antes das lojas

- [ ] upload, ordenação e exclusão de imagens;
- [ ] favoritos persistentes;
- [ ] denúncia e moderação de conteúdo;
- [ ] recuperação de senha;
- [ ] exclusão de conta e dados pelo aplicativo;
- [ ] página web para solicitar exclusão de conta;
- [ ] Termos de Uso;
- [ ] Política de Privacidade;
- [ ] canal de atendimento ao titular;
- [ ] consentimentos versionados;
- [ ] ícone, splash e identidade da loja;
- [ ] screenshots Android e iOS;
- [ ] descrição curta e longa;
- [ ] classificação etária e declarações de privacidade;
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
- [ ] criar workflows automáticos somente depois do primeiro build manual assistido.

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
- cadastro, aprovação, busca e contato tiverem sido testados de ponta a ponta;
- não houver falhas críticas abertas;
- os documentos legais e a exclusão de conta estiverem disponíveis;
- a administração conseguir operar o produto sem editar diretamente o banco.
