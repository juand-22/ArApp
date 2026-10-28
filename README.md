<div align="center">

# AppAr

Mercado cripto en tiempo real, con una interfaz oscura diseñada para móvil.

![Expo](https://img.shields.io/badge/Expo-SDK%2058-1C0C29?logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-0.88-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)
![Licencia](https://img.shields.io/badge/Licencia-MIT-3DDC97)

</div>

## Descripción

AppAr es una aplicación móvil de seguimiento de criptomonedas construida con **Expo** y **React Native**. Permite seguir los precios del mercado en vivo, explorar el historial de cada activo con gráficos de velas OHLC y guardar criptomonedas en una lista de favoritos persistente.

Los precios en tiempo real llegan por WebSocket desde el mercado Spot público de **Binance** (cotizaciones USDT como aproximación de USD). Las estadísticas globales y el historial de precios se obtienen de la API de **CoinGecko**. Si los servicios no están disponibles, la app degrada con elegancia: mantiene los últimos datos y muestra un snapshot local etiquetado como datos de referencia.

## Características

- **Precios en vivo** vía WebSocket de Binance, con reconexión automática y estado de conexión visible (en vivo, reconectando, modo demo).
- **Listado de mercado** con búsqueda por nombre o símbolo, sparklines de 7 días y variación de 24 horas.
- **Gráficos OHLC interactivos** con rangos de 1 hora, 24 horas, 7 días, 30 días, 1 año e histórico completo, con inspección táctil.
- **Favoritos persistentes** (AsyncStorage) con pantalla dedicada, filtros de alcistas/bajistas y sugerencias para empezar.
- **Detalle por activo**: capitalización, volumen, máximos y mínimos de 24 h, máximo histórico y suministro en circulación.
- **Resiliencia**: reintentos con backoff exponencial, timeouts en todas las peticiones y snapshot offline incluido.
- **UI oscura mobile-first** con animaciones en el hilo de UI (Reanimated), respeto al ajuste de *reducir movimiento* y soporte web responsive (SSR).

## Stack técnico

| Herramienta | Versión | Uso |
| --- | --- | --- |
| [Expo](https://expo.dev) | SDK 58 | Plataforma, builds con EAS, generación nativa continua |
| [React Native](https://reactnative.dev) | 0.88 | UI multiplataforma (con React Compiler activado) |
| [Expo Router](https://docs.expo.dev/router/introduction/) | ~58 | Navegación basada en archivos con rutas tipadas |
| [TypeScript](https://www.typescriptlang.org) | ~6.0 | Tipado estático en todo el proyecto |
| [Reanimated](https://docs.swmansion.com/react-native-reanimated/) | 4.7 | Animaciones en el hilo de UI |
| [react-native-svg](https://github.com/software-mansion/react-native-svg) | 15.16 | Gráficos de precios y sparklines |
| [Async Storage](https://react-native-async-storage.github.io/async-storage/) | 2.2 | Persistencia de la watchlist |
| [Manrope](https://fonts.google.com/specimen/Manrope) | — | Tipografía de la app |

## Fuentes de datos

| Fuente | Uso | Frecuencia |
| --- | --- | --- |
| CoinGecko `coins/markets`, `/global` | Listado, estadísticas globales | Cada 30 s (solo con la app activa) |
| CoinGecko `market_chart` | Historial para los gráficos | A demanda, con caché de 20 s |
| Binance WebSocket `@ticker` | Precios en vivo (pares USDT) | Streaming, agrupado cada 500 ms |
| Snapshot local (`fallback-market.json`) | Modo sin conexión | Estático; se regenera con un script |

## Puesta en marcha

Requisitos: [Node.js LTS](https://nodejs.org) y npm. También puedes usar [Expo Go](https://expo.dev/go) en tu dispositivo para probarla sin compilar.

```bash
git clone <url-del-repositorio>
cd ArApp
npm install
npx expo start
```

Desde la terminal puedes abrir la app con `a` (Android), `i` (iOS) o `w` (web), o escanear el QR con Expo Go.

## Scripts disponibles

| Comando | Descripción |
| --- | --- |
| `npm start` | Inicia el servidor de desarrollo |
| `npm run android` / `ios` / `web` | Abre la app en la plataforma indicada |
| `npm run lint` | Comprueba el estilo de código (ESLint) |
| `npx tsc --noEmit` | Verificación de tipos |
| `node scripts/fetch-fallback.mjs` | Regenera el snapshot offline de mercado |

## Estructura del proyecto

```
src/
├── app/                  # Pantallas (Expo Router): todo archivo aquí es una ruta
│   ├── _layout.tsx       #   Stack raíz: fuentes, proveedor de mercado, transiciones
│   ├── (tabs)/           #   Inicio (mercado) y Favoritos
│   └── coin/[id].tsx     #   Detalle de criptomoneda
├── components/           # Componentes de la app (filas, gráficos, navegación)
│   └── ui/               #   Sistema de diseño: botones, tarjetas, badges, skeletons…
├── constants/            # Tokens de diseño: paleta, espaciado, radios, tipografía
├── context/              # MarketProvider: estado global del mercado y favoritos
├── hooks/                # useCoinChart, useEntrance, useValuePulse
└── lib/                  # API de CoinGecko, stream de Binance, formato, snapshot
```

## Compilación y publicación

Los binarios se generan en la nube con [EAS Build](https://docs.expo.dev/build/introduction/) — no hace falta Xcode ni Android Studio locales:

```bash
npx eas-cli@latest build --profile development  # build de desarrollo (dev client)
npx eas-cli@latest build --profile preview      # APK interno para pruebas
npx eas-cli@latest build --profile production   # build de tienda, versionado automático
```

Las actualizaciones over-the-air se publican con `npx eas-cli@latest update`.

## Aviso

Los datos mostrados son solo con fines informativos y no constituyen asesoría financiera. Los precios en vivo provienen de pares USDT de Binance como aproximación de USD.

## Licencia

Distribuido bajo la [licencia MIT](LICENSE).
