import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
        <meta name="theme-color" content="#081526" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Connexio" />
        <meta name="description" content="Connexio — rede privada, negócios e gestão da Loja em um único app." />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" href="/connexio-icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/connexio-icon.svg" />
        <ScrollViewStyleReset />
      </head>
      <body>{children}
        <script dangerouslySetInnerHTML={{__html:"if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){})})}"}} />
      </body>
    </html>
  );
}
