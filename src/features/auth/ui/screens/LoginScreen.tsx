import { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withDelay,
} from 'react-native-reanimated';
import { AlertCircle } from 'lucide-react-native';
import { login, type LoginResult } from '@/shared/services/auth/keycloak.service';
import { colors, typography, spacing, radius, shadows } from '@/shared/design-system/tokens';
import type { AuthScreenProps } from '@/navigation/types';

type Status = 'loading' | 'error';

type Props = AuthScreenProps<'Login'>;

export function LoginScreen({ navigation }: Props) {
  const [status, setStatus]       = useState<Status>('loading');
  const [errorMsg, setErrorMsg]   = useState('');
  const isMounted                 = useRef(true);

  // Top bar entrance
  const topBarOpacity = useSharedValue(0);
  const topBarY       = useSharedValue(-10);

  useEffect(() => {
    topBarOpacity.value = withTiming(1,  { duration: 400 });
    topBarY.value       = withTiming(0,  { duration: 400 });
    return () => { isMounted.current = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const topBarStyle = useAnimatedStyle(() => ({
    opacity:   topBarOpacity.value,
    transform: [{ translateY: topBarY.value }],
  }));

  const startLogin = async () => {
    if (!isMounted.current) return;
    setStatus('loading');

    let result: LoginResult | undefined;
    try {
      result = await login();
    } catch (err) {
      if (!isMounted.current) return;
      const msg = err instanceof Error ? err.message : 'Erro ao autenticar';
      setErrorMsg(msg);
      setStatus('error');
      return;
    }

    if (!isMounted.current) return;

    if (result === 'dismissed') {
      navigation.goBack();
    }
    // 'success': auth.store is updated → RootNavigator renders MusicianTabs reactively
  };

  useEffect(() => {
    startLogin();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <Animated.View style={[styles.topBar, topBarStyle]}>
        <Text style={styles.brand}>SoundMeet</Text>
      </Animated.View>

      <View style={styles.content}>
        {status === 'loading' ? (
          <LoadingState />
        ) : (
          <ErrorState
            message={errorMsg}
            onRetry={startLogin}
            onBack={() => navigation.goBack()}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

// ── Loading state ──────────────────────────────────────────────────────────────

function LoadingState() {
  const opacity  = useSharedValue(0);
  const scale    = useSharedValue(0.95);
  const pulseS   = useSharedValue(1);
  const pulseO   = useSharedValue(0.7);
  const spinRot  = useSharedValue(0);

  useEffect(() => {
    opacity.value  = withTiming(1,    { duration: 400 });
    scale.value    = withTiming(1,    { duration: 400 });
    pulseS.value   = withRepeat(withTiming(1.12, { duration: 900 }), -1, true);
    pulseO.value   = withRepeat(withTiming(1,    { duration: 900 }), -1, true);
    spinRot.value  = withRepeat(withTiming(360,  { duration: 1200 }), -1, false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wrapStyle   = useAnimatedStyle(() => ({
    opacity:   opacity.value,
    transform: [{ scale: scale.value }],
  }));
  const pulseStyle  = useAnimatedStyle(() => ({
    opacity:   pulseO.value,
    transform: [{ scale: pulseS.value }],
  }));
  const spinStyle   = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spinRot.value}deg` }],
  }));

  return (
    <Animated.View style={[styles.stateWrapper, wrapStyle]}>
      <Animated.View style={[styles.pulseRing, pulseStyle]}>
        <Animated.View style={[styles.spinnerArc, spinStyle]} />
      </Animated.View>

      <Text style={styles.loadingTitle}>Abrindo autenticação</Text>
      <Text style={styles.loadingSubtitle}>Aguarde enquanto a janela segura abre…</Text>
    </Animated.View>
  );
}

// ── Error state ────────────────────────────────────────────────────────────────

function ErrorState({
  message,
  onRetry,
  onBack,
}: {
  message: string;
  onRetry: () => void;
  onBack:  () => void;
}) {
  const opacity = useSharedValue(0);
  const transY  = useSharedValue(20);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400 });
    transY.value  = withTiming(0, { duration: 400 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity:   opacity.value,
    transform: [{ translateY: transY.value }],
  }));

  return (
    <Animated.View style={[styles.stateWrapper, animStyle]}>
      <View style={styles.errorIconWrapper}>
        <AlertCircle size={36} color={colors.accent.coral} strokeWidth={1.5} />
      </View>

      <Text style={styles.errorTitle}>Falha na autenticação</Text>
      <Text style={styles.errorMsg}>{message}</Text>

      <Pressable
        onPress={onRetry}
        style={({ pressed }) => [styles.retryButton, pressed && styles.buttonPressed]}
        accessibilityRole="button"
        accessibilityLabel="Tentar autenticação novamente"
      >
        <Text style={styles.retryText}>Tentar novamente</Text>
      </Pressable>

      <Pressable
        onPress={onBack}
        style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
        accessibilityRole="button"
        accessibilityLabel="Voltar para onboarding"
      >
        <Text style={styles.backText}>Voltar</Text>
      </Pressable>
    </Animated.View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const PULSE_SIZE = 80;

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: colors.bg.primary,
  },
  topBar: {
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  brand: {
    ...typography.title,
    color:        colors.brand.primary,
    letterSpacing: -0.3,
  },
  content: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    padding:        spacing.xl,
  },

  // Loading
  stateWrapper: {
    alignItems: 'center',
    gap:        spacing.md,
    maxWidth:   320,
  },
  pulseRing: {
    width:          PULSE_SIZE,
    height:         PULSE_SIZE,
    borderRadius:   PULSE_SIZE / 2,
    borderWidth:    2,
    borderColor:    colors.brand.primary,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   spacing.sm,
    ...shadows.brand,
  },
  spinnerArc: {
    width:          PULSE_SIZE - 12,
    height:         PULSE_SIZE - 12,
    borderRadius:   (PULSE_SIZE - 12) / 2,
    borderWidth:    3,
    borderColor:    'transparent',
    borderTopColor: colors.brand.primary,
  },
  loadingTitle: {
    ...typography.title,
    color:     colors.text.primary,
    textAlign: 'center',
  },
  loadingSubtitle: {
    ...typography.body,
    color:     colors.text.muted,
    textAlign: 'center',
  },

  // Error
  errorIconWrapper: {
    width:           64,
    height:          64,
    borderRadius:    32,
    backgroundColor: 'rgba(255,107,107,0.12)',
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    spacing.sm,
  },
  errorTitle: {
    ...typography.title,
    color:     colors.text.primary,
    textAlign: 'center',
  },
  errorMsg: {
    ...typography.bodySm,
    color:     colors.text.muted,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor:   colors.brand.primary,
    borderRadius:      radius.xl,
    paddingVertical:   spacing.md,
    paddingHorizontal: spacing.xxl,
    alignSelf:         'stretch',
    alignItems:        'center',
    ...shadows.brand,
  },
  retryText: {
    ...typography.body,
    fontFamily: 'Inter-SemiBold',
    color:      colors.text.inverse,
  },
  backButton: {
    paddingVertical:   spacing.md,
    paddingHorizontal: spacing.xxl,
    alignSelf:         'stretch',
    alignItems:        'center',
  },
  backText: {
    ...typography.body,
    color: colors.text.muted,
  },
  buttonPressed: {
    opacity:   0.75,
    transform: [{ scale: 0.97 }],
  },
});
