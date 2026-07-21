# ADR 0001 — Expo SDK do protótipo

## Status

Aceito em 21 de julho de 2026.

## Decisão

Iniciar o protótipo com Expo SDK 54.

## Contexto

Durante a transição oficial para o SDK 57, a documentação do Expo informa que projetos destinados ao Expo Go em dispositivo físico devem permanecer temporariamente no SDK 54. O objetivo imediato do Connexio é permitir abertura rápida por QR code e validação de experiência.

## Consequências

- máxima facilidade para o piloto via Expo Go;
- React Native 0.81 e Expo Router 6;
- atualização planejada para SDK 57 quando o fluxo migrar para development build;
- nenhuma dependência deve ser adicionada sem validação pelo `expo install`.
