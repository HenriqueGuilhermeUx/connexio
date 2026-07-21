# Modelo de acesso, onboarding e aprovação

## Objetivo

Permitir que um novo membro perceba valor e conclua seu onboarding sem fricção, sem comprometer a confiança da rede antes da validação manual.

O princípio é simples:

> Preencher tudo desde o início; liberar visibilidade e contatos somente depois da validação.

## Cadastro da conta

O cadastro inicial solicita:

- nome completo;
- e-mail;
- telefone/WhatsApp;
- número do CIM;
- senha e confirmação da senha.

O login recorrente usa somente e-mail e senha.

O CIM fica armazenado em `member_verifications`, separado do perfil público. Ele nunca aparece em cards, perfis públicos, buscas ou eventos analíticos.

## Onboarding explicativo

Antes do cadastro, três telas explicam:

1. **Procurar:** pesquisa por produto, serviço, profissional, cidade e segmento.
2. **Oferecer:** cadastro completo de loja, negócio, serviço ou produto.
3. **Validar:** a administração confere o CIM; até a liberação, contatos e publicação pública permanecem protegidos.

Após criar a conta, o membro pendente chega a uma tela com duas escolhas visíveis:

- `Pesquisar ofertas`;
- `Cadastrar minha oferta`.

Nenhuma tela deve exigir conhecimento técnico ou apresentar regras longas antes da ação principal.

## Estados do membro

### `PENDING`

O usuário já possui conta e entra no aplicativo, mas aguarda validação manual.

Pode:

- visualizar uma vitrine limitada de ofertas marcadas como prévia;
- pesquisar por termo, segmento, cidade e região dentro dessa vitrine;
- cadastrar loja, negócio, serviço ou produto;
- preencher título, descrição, segmento, cidade, região, preço, benefício, site, e-mail e WhatsApp;
- editar suas próprias informações e ofertas;
- acompanhar o status da solicitação;
- acessar seus próprios rascunhos e ofertas privadas.

Não pode:

- visualizar telefone, WhatsApp ou e-mail dos outros ofertantes;
- iniciar contato com outros membros;
- receber contatos, porque sua oferta ainda não aparece no catálogo público;
- aparecer como membro verificado.

A oferta recebe `PENDING_MEMBER_APPROVAL`. Todos os dados são preservados, mas ela fica visível apenas ao proprietário e à administração.

### `APPROVED`

A validação manual foi concluída.

O usuário passa a poder:

- visualizar todo o catálogo publicado;
- acessar contatos de ofertas publicadas;
- iniciar contatos pelo WhatsApp;
- aparecer como membro verificado;
- enviar suas ofertas completas para revisão editorial;
- receber contatos quando a oferta for publicada.

Ofertas do membro que estavam em `PENDING_MEMBER_APPROVAL` são promovidas automaticamente para `PENDING_REVIEW`. A administração publica, rejeita ou solicita ajustes.

### `REJECTED`

A solicitação foi analisada e não aprovada. O usuário mantém acesso à explicação e ao canal de contestação, sem exploração da rede.

### `SUSPENDED`

O acesso foi interrompido após aprovação. Ofertas publicadas são pausadas e contatos deixam de ficar disponíveis.

## Estados da oferta

- `DRAFT`: rascunho privado;
- `PENDING_MEMBER_APPROVAL`: oferta completa de membro ainda pendente;
- `PENDING_REVIEW`: membro aprovado aguardando moderação;
- `PUBLISHED`: disponível no catálogo;
- `PAUSED`: temporariamente indisponível;
- `REJECTED`: publicação recusada;
- `REMOVED`: retirada administrativamente, mantendo histórico.

## Catálogo de prévia

Uma oferta publicada pode receber `is_preview = true` pela administração. Apenas essas ofertas aparecem para membros pendentes.

A prévia demonstra valor, mas a tabela `listing_contacts` é protegida por RLS e não pode ser consultada por terceiros pendentes.

## Aviso administrativo por e-mail

Ao inserir uma solicitação em `member_verifications`:

1. o banco cria um evento único em `admin_notification_outbox`;
2. um Database Webhook chama a Edge Function `notify-new-member`;
3. a função envia o e-mail por um provedor transacional;
4. o evento fica como `SENT` ou `FAILED`, com trilha para reprocessamento.

Credenciais de e-mail ficam nos Secrets das Edge Functions e nunca no aplicativo.

## Aprovação manual

A primeira operação será feita no painel administrativo do Connexio:

1. consultar cadastro e CIM;
2. aprovar, rejeitar ou suspender;
3. registrar motivo;
4. registrar administrador e horário;
5. promover ofertas do membro aprovado para revisão.

Toda decisão gera evento em `moderation_events`.

## Pesquisa e segmentos

A pesquisa deve aceitar:

- nome da oferta;
- descrição;
- produto ou serviço;
- cidade e região;
- segmento.

A taxonomia inicial contempla mais de 30 segmentos e permanece administrável no banco.

## Crédito institucional

Interfaces institucionais exibem:

- `Desenvolvido por Alternative Ventures`;
- `CNPJ 61.920.356/0001-38`.

A razão social e os textos legais serão confirmados nos Termos de Uso e na Política de Privacidade.

## Princípios de segurança

1. `service_role` nunca entra no aplicativo.
2. Autorização é aplicada no banco com Row Level Security.
3. Dados de autorização não dependem de `raw_user_meta_data` após o cadastro.
4. Contatos ficam em tabela separada.
5. CIM fica separado do perfil público.
6. O membro pode preencher tudo, mas não controla seu próprio status nem a publicação pública.
