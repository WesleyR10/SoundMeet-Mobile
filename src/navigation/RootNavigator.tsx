import { useEffect } from 'react';
import { View, Text, ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import { restoreSession } from '@/shared/services/auth/keycloak.service';
import { useMusicianWizardGate } from '@/features/musician/application/useMusicianWizardGate';
import { MusicianSetupWizardScreen } from '@/features/musician/ui/screens/MusicianSetupWizardScreen';
import { SharedRepertoireScreen } from '@/features/shared-repertoire/ui/screens/SharedRepertoireScreen';
import { SharedSongViewerScreen } from '@/features/shared-repertoire/ui/screens/SharedSongViewerScreen';
import { ConversationListScreen } from '@/features/scheduling/ui/screens/ConversationListScreen';
import { ChatScreen } from '@/features/scheduling/ui/screens/ChatScreen';
import { useNotificationResponseListener, checkInitialNotificationResponse } from '@/shared/services/notifications/useNotificationResponseListener';
import { useDeepLinkListener, checkInitialDeepLink } from '@/shared/services/deep-linking/useDeepLinkListener';
import { useDeepLinkStore } from '@/shared/services/deep-linking/deep-link.store';
import { colors, spacing, radius, typography, shadows } from '@/shared/design-system/tokens';
import { AuthNavigator } from './AuthNavigator';
import { MusicianTabNavigator } from './MusicianTabNavigator';
import { FanTabNavigator } from './FanTabNavigator';
import { navigationRef } from './navigationRef';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const isLoading       = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isAudience      = useAuthStore((s) => s.user?.roles.includes('audience') ?? false);
  // Seguro chamar incondicionalmente: internamente enabled=false quando não há
  // musicianId (deslogado ou audience) e retorna { kind: 'not-applicable' }.
  const gate = useMusicianWizardGate();
  const pendingSharedToken = useDeepLinkStore((s) => s.pendingSharedRepertoireToken);
  const clearPendingSharedToken = useDeepLinkStore((s) => s.clearPendingSharedRepertoireToken);

  useEffect(() => {
    restoreSession();
  }, []);

  // Único lugar do app onde navigationRef fica válido (Bloco 5.6) — precisa
  // ficar acima dos returns condicionais de loading pra montar cedo. Cobre só
  // warm/background aqui; cold start é tratado via onReady do
  // NavigationContainer abaixo (navigationRef só fica pronto ali de verdade).
  useNotificationResponseListener();
  useDeepLinkListener();

  // Link de repertório compartilhado tocado ANTES do login terminar (cold
  // start, ou app aberto na tela de login) fica "pendurado" no
  // deep-link.store — assim que a sessão resolve (autenticado + gate do
  // wizard já decidido, pra não competir com a tela do wizard), navega e
  // limpa. Ver useDeepLinkListener.ts pro porquê de precisar desse relay
  // (SharedRepertoire só existe registrada no Stack quando autenticado).
  useEffect(() => {
    if (!pendingSharedToken) return;
    // 'needs-wizard' também precisa esperar — SharedRepertoire só é
    // registrada no Stack.Navigator abaixo quando o gate resolve pro ramo
    // de tabs (senão navigate() falharia silenciosamente contra uma tela
    // não montada, e o token seria perdido pra sempre pelo clear abaixo).
    if (!isAuthenticated || gate.kind === 'loading' || gate.kind === 'error' || gate.kind === 'needs-wizard') return;
    if (navigationRef.isReady()) {
      navigationRef.navigate('SharedRepertoire', { token: pendingSharedToken });
      clearPendingSharedToken();
    }
  }, [pendingSharedToken, isAuthenticated, gate.kind, clearPendingSharedToken]);

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <StatusBar style="light" />
        <ActivityIndicator color={colors.brand.primary} size="large" />
      </View>
    );
  }

  // Guard do item 1.14: músico autenticado sem stage_name ainda não terminou o
  // onboarding (Bloco 1.13) — buscar/confirmar isso via GET /musicians/:id
  // acontece antes de decidir entre AuthStack/Wizard/Tabs.
  if (isAuthenticated && gate.kind === 'loading') {
    return (
      <View style={styles.loader}>
        <StatusBar style="light" />
        <ActivityIndicator color={colors.brand.primary} size="large" />
      </View>
    );
  }

  if (isAuthenticated && gate.kind === 'error') {
    return (
      <View style={styles.loader}>
        <StatusBar style="light" />
        <Text style={styles.errorTitle}>Não conseguimos carregar seu perfil</Text>
        <Text style={styles.errorMsg}>Verifique sua conexão e tente novamente.</Text>
        <Pressable
          onPress={gate.retry}
          style={({ pressed }) => [styles.retryButton, pressed && { opacity: 0.8 }]}
          accessibilityRole="button"
          accessibilityLabel="Tentar novamente"
        >
          <Text style={styles.retryText}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        checkInitialNotificationResponse();
        checkInitialDeepLink();
      }}
    >
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen
            name="AuthStack"
            component={AuthNavigator}
            options={{ animationTypeForReplace: 'pop' }}
          />
        ) : gate.kind === 'needs-wizard' ? (
          <Stack.Screen
            name="MusicianSetupWizard"
            component={MusicianSetupWizardScreen}
            options={{ gestureEnabled: false, animationTypeForReplace: 'push' }}
          />
        ) : (
          <>
            {isAudience && gate.kind === 'not-applicable' ? (
              // Fã (sem role musician) — antes disso, qualquer audience caía
              // aqui e via MusicianTabs por omissão (Bloco 10.4). Usuário com as
              // duas roles (musician+audience) continua em MusicianTabs, porque
              // gate.kind não será 'not-applicable' nesse caso (ver
              // useMusicianWizardGate.ts) — visão de músico tem precedência até
              // o role-switching do Bloco 10.5 existir.
              <Stack.Screen
                name="FanTabs"
                component={FanTabNavigator}
                options={{ animationTypeForReplace: 'push' }}
              />
            ) : (
              <Stack.Screen
                name="MusicianTabs"
                component={MusicianTabNavigator}
                options={{ animationTypeForReplace: 'push' }}
              />
            )}
            {/* Alcançável a partir de QUALQUER role (músico ou fã) via deep
                link — por isso não é filha de MusicianTabs/FanTabs, é uma
                irmã registrada sempre que autenticado. */}
            <Stack.Screen name="SharedRepertoire" component={SharedRepertoireScreen} />
            <Stack.Screen name="SharedSongViewer" component={SharedSongViewerScreen} />
            {/* Chat (Bloco 9) — só faz sentido pro músico hoje (estabelecimento
                é web-only), mas registrado aqui pelo mesmo motivo das duas
                telas acima: alcançável a partir da Home (sem stack própria)
                e do tap numa notificação push, nenhum caso é filho natural
                de MusicianTabs. */}
            <Stack.Screen name="ConversationList" component={ConversationListScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex:            1,
    alignItems:      'center',
    justifyContent:  'center',
    backgroundColor: colors.bg.primary,
    padding:          spacing.xl,
    gap:              spacing.md,
  },
  errorTitle: {
    ...typography.title,
    color:     colors.text.primary,
    textAlign: 'center',
  },
  errorMsg: {
    ...typography.body,
    color:        colors.text.muted,
    textAlign:    'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    backgroundColor:   colors.brand.primary,
    borderRadius:      radius.xl,
    paddingVertical:   spacing.md,
    paddingHorizontal: spacing.xxl,
    ...shadows.brand,
  },
  retryText: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.inverse,
  },
});
