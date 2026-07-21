# Connexio

**Confiança que gera negócios.**

Connexio é uma rede privada de negócios, produtos, serviços e benefícios entre membros verificados. O MVP valida o núcleo do produto: identificar membros, publicar ofertas, encontrar profissionais e gerar contatos diretos pelo WhatsApp.

## Estado atual

Este repositório contém um protótipo funcional em Expo/React Native, sem backend, pronto para validação de experiência e fluxo.

### Fluxos disponíveis

- boas-vindas e proposta de valor;
- login de demonstração;
- solicitação de acesso com status pendente;
- feed de produtos e serviços;
- busca por texto e categoria;
- detalhe da oferta e contato pelo WhatsApp;
- favoritos;
- publicação local de oferta;
- perfil verificado;
- painel administrativo de aprovação, em modo demonstração.

## Stack

- Expo SDK 54;
- React Native 0.81;
- React 19;
- Expo Router;
- TypeScript estrito.

> Em julho de 2026, durante a transição para o SDK 57, o template SDK 54 permanece indicado pela documentação do Expo para testes no Expo Go em dispositivo físico. A evolução para development build e SDK 57 está registrada no roadmap.

## Como executar

```bash
npm install
npx expo start --clear
```

Abra o QR code com o Expo Go. No login de demonstração, os campos já aparecem preenchidos.

## Estrutura

```text
app/                 rotas e telas do Expo Router
src/components/      componentes de interface
src/context/         estado temporário do protótipo
src/data/            dados de demonstração
src/theme/           tokens visuais
src/types/           contratos de domínio
docs/                produto, arquitetura, dados e decisões
```

## Princípios do MVP

1. O produto começa como rede privada de negócios, não como e-commerce transacional.
2. O evento de valor é um contato qualificado entre membros.
3. CIM é dado de validação e nunca deve ser exposto publicamente.
4. Pagamentos, chat interno, agenda e cupons avançados ficam fora do núcleo inicial.
5. O backend futuro deve manter trilha de auditoria para toda decisão administrativa.

## Próximo marco

Conectar autenticação, persistência, moderação, armazenamento de imagens e métricas ao Supabase. Consulte [`docs/ROADMAP.md`](docs/ROADMAP.md).
