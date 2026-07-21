# Modelo de dados inicial

## Tabelas principais

### profiles

Dados públicos e operacionais da conta: nome, cidade, região, avatar e estado da conta.

### member_verifications

Dados privados de validação: CIM, Loja declarada, situação, evidência, analista, motivo e datas. Nunca expor CIM na API pública.

### lodges

Cadastro normalizado de Lojas para evitar nomes e números digitados de formas diferentes.

### categories

Taxonomia administrável com categoria pai, nome, slug, ordem e estado.

### listings

Oferta publicada: proprietário, tipo, título, descrição, categoria, preço, área de atendimento, benefício, situação de moderação e validade.

### listing_images

Arquivos, ordem e imagem principal do anúncio.

### favorites

Relação única entre membro e anúncio.

### contact_events

Evento de clique para WhatsApp, com membro, anúncio, data e contexto de origem. Não registra o conteúdo da conversa.

### reports

Denúncias de anúncio ou membro, motivo, descrição, situação e resolução.

### moderation_events

Trilha de auditoria: ator, entidade, ação, motivo, estado anterior, estado posterior e timestamp.

## Estados recomendados

### Conta

`PENDING_VERIFICATION`, `ACTIVE`, `SUSPENDED`, `DELETED`

### Validação

`PENDING`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `REVALIDATION_REQUIRED`

### Anúncio

`DRAFT`, `PENDING_REVIEW`, `PUBLISHED`, `PAUSED`, `REJECTED`, `EXPIRED`, `REMOVED`

## Regras críticas

- um CIM ativo por membro;
- e-mail normalizado e único;
- favoritos únicos por membro e anúncio;
- anúncios excluídos com soft delete;
- decisão administrativa sempre acompanhada de motivo;
- clique em contato só pode ser gerado por sessão autenticada;
- administrador não lê arquivos privados sem finalidade registrada.
