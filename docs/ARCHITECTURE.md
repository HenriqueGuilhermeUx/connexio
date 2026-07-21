# Arquitetura do Connexio

## Objetivo

Manter o aplicativo desacoplado do provedor de backend, permitindo validar o produto com dados locais e conectar o Supabase sem reescrever as telas.

## Camadas propostas

```text
UI / Expo Router
  ↓
Casos de uso e estado de sessão
  ↓
Interfaces de repositório
  ↓
Supabase Auth, Postgres, Storage e Edge Functions
```

## Aplicativo

- Expo SDK 54 para compatibilidade imediata com Expo Go durante o piloto;
- Expo Router para navegação baseada em arquivos e deep links;
- TypeScript em modo estrito;
- componentes visuais próprios, sem dependência de biblioteca pesada;
- tokens de tema centralizados.

## Backend recomendado

### Supabase Auth

- login por e-mail e senha;
- verificação de e-mail;
- recuperação de senha;
- sessão segura;
- autorização por papel.

### PostgreSQL

Dados relacionais de usuários, membros, Lojas, anúncios, categorias, favoritos, denúncias e auditoria.

### Storage

Fotos de perfil, imagens de anúncios e evidências privadas de validação. Buckets públicos e privados devem ser separados.

### Edge Functions

- envio de notificações;
- integração administrativa;
- operações que exigem segredo;
- geração de links ou mensagens controladas.

## Segurança

- Row Level Security em todas as tabelas expostas ao cliente;
- dados de validação separados do perfil público;
- ações administrativas via função segura;
- logs imutáveis de moderação;
- rate limiting para cadastro, busca e contato;
- arquivos privados acessados com URL assinada.

## Estado atual do protótipo

`AppContext` simula autenticação, favoritos, publicação e catálogo em memória. Ele deve ser substituído gradualmente por serviços e repositórios, preservando a API consumida pelas telas.

## Próxima estrutura de código

```text
src/services/supabase.ts
src/repositories/listings.ts
src/repositories/members.ts
src/repositories/moderation.ts
src/features/auth/
src/features/listings/
src/features/admin/
```
