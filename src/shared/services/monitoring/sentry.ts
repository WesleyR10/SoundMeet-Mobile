import * as Sentry from '@sentry/react-native';
import { ENV } from '@/shared/services/config/env';

// Chamado uma única vez, em escopo de módulo, no topo de App.tsx — mesmo
// padrão de SplashScreen.preventAutoHideAsync()/Notifications.setNotificationHandler()
// já usados ali. DSN vazio (dev sem projeto Sentry ainda) deixa o SDK inerte:
// não lança, só não envia nada.
export function initSentry(): void {
  Sentry.init({
    dsn: ENV.SENTRY_DSN || undefined,
    environment: ENV.APP_ENV,
    tracesSampleRate: ENV.IS_DEV ? 1.0 : 0.2,
    enabled: !!ENV.SENTRY_DSN,
  });
}

// Breadcrumb de navegação (React Navigation) fica fora de escopo por ora —
// exigiria plugar Sentry.reactNavigationIntegration() no navigationRef de
// RootNavigator.tsx. Sentry.wrap(App) em App.tsx já cobre o essencial: error
// boundary automático + tracing de app start/TTID.
