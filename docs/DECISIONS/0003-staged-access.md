# ADR 0003 — Acesso progressivo por aprovação

## Status

Aceita.

## Contexto

O Connexio precisa demonstrar valor rapidamente a um novo usuário sem permitir que uma conta ainda não validada acesse ou exponha dados de contato da rede.

## Decisão

Adotar acesso progressivo baseado no estado do membro:

- contas `PENDING` entram no aplicativo, visualizam apenas ofertas marcadas como prévia e podem enviar uma oferta básica privada;
- dados de contato ficam em tabela separada e só são legíveis por membros `APPROVED`;
- ofertas de contas pendentes recebem `PENDING_MEMBER_APPROVAL`;
- a aprovação do membro promove essas ofertas para `PENDING_REVIEW`;
- publicação pública continua dependendo de moderação;
- CIM é armazenado fora do perfil público;
- autorização é aplicada por RLS no banco.

## Consequências

### Positivas

- reduz abandono logo após o cadastro;
- preserva a promessa de confiança;
- evita depender apenas de botões ocultos na interface;
- permite curar uma vitrine específica para usuários pendentes;
- cria uma trilha clara entre cadastro, aprovação e publicação.

### Custos

- exige operação administrativa no começo;
- exige duas camadas de moderação: membro e oferta;
- exige catálogo inicial marcado como prévia;
- exige tratamento explícito para rejeição, suspensão e contestação.
