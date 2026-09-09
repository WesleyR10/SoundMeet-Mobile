import { useEffect } from 'react';
import { View, Text, ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '@/shared/services/auth/auth.store';
import { restoreSession } from '@/shared/services/auth/keycloak.service';
import { useLiveSetStore } from '@/features/musician/application/liveSet.store';
import { useMusicianWizardGate } from '@/features/musician/application/useMusicianWizardGate';
import { MusicianSetupWizardScreen } from '@/features/musician/ui/screens/MusicianSetupWizardScreen';
import { SharedRepertoireScreen } from '@/features/shared-repertoire/ui/screens/SharedRepertoireScreen';
import { SharedSongViewerScreen } from '@/features/shared-repertoire/ui/screens/SharedSongViewerScreen';
import { ConversationListScreen } from '@/features/scheduling/ui/screens/ConversationListScreen';
import { InquiryListScreen } from '@/features/scheduling/ui/screens/InquiryListScreen';
import { ChatScreen } from '@/features/scheduling/ui/screens/ChatScreen';
import { AgendaScreen } from '@/features/scheduling/ui/screens/AgendaScreen';
import { AvailabilityEditorScreen } from '@/features/scheduling/ui/screens/AvailabilityEditorScreen';
import { ContractListScreen } from '@/features/contract/ui/screens/ContractListScreen';
import { ContractDetailScreen } from '@/features/contract/ui/screens/ContractDetailScreen';
import { PerformanceReportScreen } from '@/features/musician/ui/screens/PerformanceReportScreen';
import { PerformanceHistoryScreen } from '@/features/musician/ui/screens/PerformanceHistoryScreen';
import { MyResumeScreen } from '@/features/musician/ui/screens/MyResumeScreen';
import { SetlistSuggestionsScreen } from '@/features/musician/ui/screens/SetlistSuggestionsScreen';
import { PlansPaywallScreen } from '@/features/musician/ui/screens/PlansPaywallScreen';
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
  const pendingMusicianId = useDeepLinkStore((s) => s.pendingMusicianId);
  const clearPendingMusicianId = useDeepLinkStore((s) => s.clearPendingMusicianId);

  const restoreLiveSet = useLiveSetStore((s) => s.restore);

  useEffect(() => {
    restoreSession();
    // Show aberto sobrevive a fechar o app: um set dura horas e o telefone
    // morre no meio. Sem restaurar, o `performanceId` se perderia e o set
    // ficaria aberto para sempre no servidor — sem relatório, e bloqueando a
    // abertura de um novo pelo índice parcial único do banco.
    void restoreLiveSet();
  }, [restoreLiveSet]);

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

  /*
   * QR code escaneado pela câmera nativa (App Link `https://soundmeet.com.br/musico/<id>`).
   *
   * Mesmo relay do token de repertório: espera a sessão resolver antes de
   * navegar, porque `MusicianPublicProfile` vive dentro do stack do fã.
   *
   * 🔴 Navegação ANINHADA — `navigate('MusicianPublicProfile', ...)` do ref
   * raiz não compila e não funcionaria: a tela não é filha direta do
   * Stack.Navigator raiz. O caminho é FanTabs → Home → tela.
   */
  useEffect(() => {
    if (!pendingMusicianId) return;
    if (!isAuthenticated || gate.kind === 'loading' || gate.kind === 'error' || gate.kind === 'needs-wizard') return;
    if (!navigationRef.isReady()) return;

    navigationRef.navigate('FanTabs', {
      screen: 'Home',
      params: {
        screen: 'MusicianPublicProfile',
        params: { musicianId: pendingMusicianId },
      },
    });
    clearPendingMusicianId();
  }, [pendingMusicianId, isAuthenticated, gate.kind, clearPendingMusicianId]);

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
            {/* Fã puro (sem role musician) vê só FanTabs. Usuário com as duas
                roles (musician+audience) entra em MusicianTabs (visão de
                músico tem precedência — gate.kind não é 'not-applicable'
                nesse caso, ver useMusicianWizardGate.ts) e ganha FanTabs
                registrada como irmã: o item "Ir para conta Fã" do
                HomeAvatarMenu navega pra ela (push; voltar = back). O switch
                completo com bottom sheet + refresh de token é o Bloco 10.5. */}
            {isAudience && gate.kind === 'not-applicable' ? (
              <Stack.Screen
                name="FanTabs"
                component={FanTabNavigator}
                options={{ animationTypeForReplace: 'push' }}
              />
            ) : (
              <>
                <Stack.Screen
                  name="MusicianTabs"
                  component={MusicianTabNavigator}
                  options={{ animationTypeForReplace: 'push' }}
                />
                {isAudience && (
                  <Stack.Screen name="FanTabs" component={FanTabNavigator} />
                )}
              </>
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
            {/* Agenda do músico (item 9, jul/2026) — tile "Agenda" da Home
                agora abre a agenda real; o chat ganhou entrada própria no
                HomeHeader (ícone Mensagens). */}
            <Stack.Screen name="Agenda" component={AgendaScreen} />
            <Stack.Screen name="AvailabilityEditor" component={AvailabilityEditorScreen} />
            {/* Propostas (A3/F1.2) — a ficha técnica do palco aparece no sheet
                de decisão, que é o momento em que ela realmente serve. */}
            <Stack.Screen name="InquiryList" component={InquiryListScreen} />
            {/* Contratos (B4/Bloco 10) — no app do músico o contrato É a tela
                do show: não há lista de bookings aqui, e o snapshot já carrega
                data, local, cachê e a Ficha Técnica. */}
            <Stack.Screen name="ContractList" component={ContractListScreen} />
            <Stack.Screen name="ContractDetail" component={ContractDetailScreen} />
            <Stack.Screen name="PerformanceReport" component={PerformanceReportScreen} />
            <Stack.Screen name="PerformanceHistory" component={PerformanceHistoryScreen} />
            <Stack.Screen name="MyResume" component={MyResumeScreen} />
            <Stack.Screen name="SetlistSuggestions" component={SetlistSuggestionsScreen} />
            {/* Paywall de planos (jul/2026) — aberto pelo HomeAvatarMenu;
                apresentação modal pra reforçar o caráter de oferta. */}
            <Stack.Screen name="Plans" component={PlansPaywallScreen} options={{ presentation: 'modal' }} />
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
