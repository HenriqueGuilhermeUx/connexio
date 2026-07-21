# Modelo de acesso e aprovação

## Objetivo

Permitir que um novo membro perceba valor imediatamente, sem comprometer a confiança da rede antes da validação manual.

## Cadastro

O cadastro inicial solicita apenas:

- nome completo;
- e-mail;
- telefone/WhatsApp;
- número do CIM;
- senha.

O login recorrente usa somente e-mail e senha.

O CIM fica armazenado em `member_verifications`, separado do perfil público. Ele nunca aparece em cards, perfis, buscas ou eventos analíticos.

## Estados do membro

### `PENDING`

O usuário já possui conta e entra no aplicativo, mas ainda está aguardando validação manual.

Pode:

- visualizar uma vitrine limitada de ofertas marcadas como prévia;
- pesquisar dentro dessa vitrine;
- criar e editar uma apresentação básica de negócio, serviço ou produto;
- acompanhar o status da solicitação;
- acessar seus próprios rascunhos.

Não pode:

- visualizar telefone, WhatsApp ou e-mail dos ofertantes;
- iniciar contato com outros membros;
- receber contatos, porque sua oferta ainda não é publicada no catálogo;
- adicionar dados avançados, benefício, preço completo ou meios de contato à oferta;
- aparecer como membro verificado.

A oferta criada recebe o status `PENDING_MEMBER_APPROVAL` e fica visível apenas para o proprietário e para a administração.

### `APPROVED`

A validação manual foi concluída.

O usuário passa a poder:

- visualizar todo o catálogo publicado;
- acessar dados de contato de ofertas publicadas;
- iniciar contato pelo WhatsApp;
- completar perfil, localização e dados profissionais;
- acrescentar detalhes, preço, benefícios e contato às próprias ofertas;
- enviar ofertas para revisão editorial;
- receber contatos quando a oferta for publicada.

Ofertas novas ou complementadas recebem `PENDING_REVIEW`. A administração publica ou rejeita o conteúdo.

### `REJECTED`

A solicitação foi analisada e não aprovada. O usuário mantém acesso apenas à explicação da decisão e ao canal de contestação, sem exploração da rede.

### `SUSPENDED`

O acesso foi interrompido após aprovação. Ofertas publicadas são pausadas e os contatos deixam de ficar disponíveis.

## Estados da oferta

- `DRAFT`: rascunho privado;
- `PENDING_MEMBER_APPROVAL`: oferta básica criada por membro ainda pendente;
- `PENDING_REVIEW`: membro aprovado aguardando moderação da oferta;
- `PUBLISHED`: disponível no catálogo;
- `PAUSED`: temporariamente indisponível;
- `REJECTED`: moderação recusou a publicação;
- `REMOVED`: retirada administrativamente, mantendo histórico.

## Catálogo de prévia

Uma oferta publicada pode receber `is_preview = true` pela administração. Apenas essas ofertas aparecem para membros pendentes.

A prévia mostra conteúdo suficiente para demonstrar valor, mas a tabela de contatos é protegida por RLS e não pode ser consultada por contas pendentes.

## Aprovação manual

A primeira operação será feita no painel administrativo do Connexio:

1. consultar cadastro e CIM;
2. aprovar, rejeitar ou suspender;
3. registrar motivo;
4. registrar administrador e horário;
5. promover ofertas `PENDING_MEMBER_APPROVAL` para `PENDING_REVIEW` após aprovação.

Toda decisão gera um evento imutável em `moderation_events`.

## Princípios de segurança

1. A chave `service_role` nunca entra no aplicativo.
2. Autorização é aplicada no banco com Row Level Security, não apenas escondida na interface.
3. Dados de autorização não dependem de `raw_user_meta_data`, pois o próprio usuário pode alterá-los.
4. Contatos ficam em tabela separada para impedir vazamento de coluna a usuários pendentes.
5. CIM fica separado do perfil público e acessível apenas ao próprio usuário e a administradores.
