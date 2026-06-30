type AppEnv = 'development' | 'preview' | 'production';

const appEnv = (process.env.APP_ENV ?? 'development') as AppEnv;
const isDev  = appEnv === 'development';

export const ENV = {
  APP_ENV: appEnv,
  IS_DEV:  isDev,

  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL
    ?? (isDev ? 'http://localhost:3000/api/v1' : ''),

  KEYCLOAK: {
    URL:          process.env.EXPO_PUBLIC_KEYCLOAK_URL       ?? 'http://localhost:8080',
    REALM:        process.env.EXPO_PUBLIC_KEYCLOAK_REALM     ?? 'soundmeet',
    CLIENT_ID:    process.env.EXPO_PUBLIC_KEYCLOAK_CLIENT_ID ?? 'soundmeet-mobile',
    REDIRECT_URI: 'soundmeet://auth/callback',
  },
} as const;
