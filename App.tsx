import './global.css';

import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { Asset } from 'expo-asset';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';

// @expo-google-fonts — mapeados para os nomes exatos do design-system/tokens.ts
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { JetBrainsMono_400Regular, JetBrainsMono_700Bold } from '@expo-google-fonts/jetbrains-mono';

import { ThemeProvider } from '@/shared/services/ThemeContext';
import { queryClient } from '@/shared/services/query/query-client';
import { RootNavigator } from '@/navigation/RootNavigator';
import { musicianVideoSource, fanVideoSource } from '@/shared/constants/role-video-sources';

// Impede o splash screen de sumir antes de as fontes carregarem
SplashScreen.preventAutoHideAsync();

// Escopo de módulo (não do componente) — precisa rodar uma única vez no
// boot, antes de qualquer notificação poder chegar. Sem isso, push recebido
// com o app aberto não aparece (comportamento padrão do SDK é não exibir).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList:   true,
    shouldPlaySound:  true,
    shouldSetBadge:   false,
  }),
});

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    'SpaceGrotesk-Medium':   SpaceGrotesk_500Medium,
    'SpaceGrotesk-SemiBold': SpaceGrotesk_600SemiBold,
    'SpaceGrotesk-Bold':     SpaceGrotesk_700Bold,
    'Inter-Regular':         Inter_400Regular,
    'Inter-Medium':          Inter_500Medium,
    'Inter-SemiBold':        Inter_600SemiBold,
    'Inter-Bold':            Inter_700Bold,
    'JetBrainsMono-Regular': JetBrainsMono_400Regular,
    'JetBrainsMono-Bold':    JetBrainsMono_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    // Fire-and-forget: aquece o cache dos vídeos de fundo do RoleSelectionScreen durante
    // o boot/onboarding/login. NÃO bloqueia a splash — em dev pode levar vários segundos
    // (asset servido pela Metro via rede), e travar o app nisso seria pior que o problema
    // que resolve. Sem prefetch, RoleVideoBackground ainda funciona, só carrega sob demanda.
    Asset.loadAsync([musicianVideoSource, fanVideoSource]).catch(() => {});
  }, []);

  // Mantém splash screen enquanto fontes carregam — evita flash de UI sem fonte
  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <RootNavigator />
          </QueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
