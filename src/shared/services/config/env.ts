type AppEnv = 'development' | 'preview' | 'production';

const appEnv = (process.env.APP_ENV ?? 'development') as AppEnv;
const isDev  = appEnv === 'development';

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL
  ?? (isDev ? 'http://localhost:3000/api/v1' : '');

// Socket.io conecta na origem pura (sem /api/v1) — o gateway NotificationsGateway
// expõe o namespace /notifications direto na raiz do host, fora do prefixo REST.
const stripApiSuffix = (url: string) => url.replace(/\/api\/v1\/?$/, '');

export const ENV = {
  APP_ENV: appEnv,
  IS_DEV:  isDev,

  API_BASE_URL: apiBaseUrl,
  WS_BASE_URL:  process.env.EXPO_PUBLIC_WS_BASE_URL ?? stripApiSuffix(apiBaseUrl),

  KEYCLOAK: {
    URL:          process.env.EXPO_PUBLIC_KEYCLOAK_URL       ?? 'http://localhost:8080',
    REALM:        process.env.EXPO_PUBLIC_KEYCLOAK_REALM     ?? 'soundmeet',
    CLIENT_ID:    process.env.EXPO_PUBLIC_KEYCLOAK_CLIENT_ID ?? 'soundmeet-mobile',
    REDIRECT_URI: 'soundmeet://auth/callback',
  },

  // DSN vazio = Sentry.init roda em modo inerte (não envia nada) — nunca
  // bloqueia o boot, mesmo sem projeto Sentry configurado ainda.
  SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN ?? '',
} as const;
