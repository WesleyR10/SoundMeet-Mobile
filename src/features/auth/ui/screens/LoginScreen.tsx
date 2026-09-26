import { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedStatusBar } from '@/shared/components/ThemedStatusBar';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { spacing, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useReducedMotion } from '@/shared/hooks/useReducedMotion';
import { GoogleAuthButton } from '@/shared/components/GoogleAuthButton';
import { AuthDivider } from '@/shared/components/AuthDivider';
import { loginWithGoogle, ESTABLISHMENT_LOGIN_MESSAGE } from '@/shared/services/auth/keycloak.service';
import { AuthGlowBackground } from '../components/AuthGlowBackground';
import { StageLightsBackground } from '../components/StageLightsBackground';
import { SoundwaveMark } from '../components/SoundwaveMark';
import { LoginForm } from '../components/LoginForm';
import { ForgotPasswordSheet } from '../components/ForgotPasswordSheet';
import { useLoginWithPassword } from '../../application/useLoginWithPassword';
import type { LoginFormValues } from '../../domain/auth.validation';
import type { AuthScreenProps } from '@/navigation/types';

type Props = AuthScreenProps<'Login'>;

/*
 * 🔴 AUTH-3 (25/set/2026) — e-mail e senha voltaram para DENTRO do app.
 *
 * A senha vai só para `POST /auth/login`, que faz o grant no client
 * CONFIDENCIAL do Keycloak (secret só no backend). É isso que a diferencia da
 * tela anterior ao AUTH-1, cuja senha ia a um client público cujo id está no
 * APK. O Google segue pelo navegador: o Google recusa login em WebView.
 */
const useStyles = makeStyles((colors) => ({
  root:   { flex: 1, backgroundColor: colors.bg.primary },
  flex:   { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop:        spacing.xl,
    paddingBottom:     spacing.xxxl,
    gap:               spacing.xl,
  },
  hero:    { alignItems: 'center', gap: spacing.md },
  eyebrow: {
    ...typography.caption,
    fontFamily:    'SpaceGrotesk-Bold',
    letterSpacing: 6,
    color:         colors.text.brand,
    marginTop:     spacing.lg,
  },
  title: {
    ...typography.displayLg,
    color:     colors.text.primary,
    textAlign: 'center',
  },
  titleAccent: { color: colors.brand.primary },
  subtitle: {
    ...typography.body,
    color:     colors.text.secondary,
    textAlign: 'center',
  },
  social:       { gap: spacing.lg },
  registerRow:  { alignItems: 'center', minHeight: 48, justifyContent: 'center' },
  registerText: { ...typography.body, color: colors.text.secondary },
  registerLink: { fontFamily: 'Inter-SemiBold', color: colors.text.brand },
}));

export function LoginScreen({ navigation }: Props) {
  const s = useStyles();
  const reducedMotion = useReducedMotion();
  const login = useLoginWithPassword();
  const energy = useSharedValue(0);
  const [alarmSignal, setAlarmSignal] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [forgotEmail, setForgotEmail] = useState<string | null>(null);

  // Cada tecla dá um "golpe" na onda, que decai sozinho. Digitar rápido mantém
  // a logo aberta; parar deixa ela voltar a respirar.
  const pulse = useCallback(() => {
    if (reducedMotion) return;
    energy.value = withSequence(withTiming(1, { duration: 70 }), withTiming(0, { duration: 650 }));
  }, [energy, reducedMotion]);

  const signalFailure = () => {
    setAlarmSignal((n) => n + 1);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  };

  // 'success' não navega: o RootNavigator reage ao auth.store.
  const onSubmit = (values: LoginFormValues) => {
    setNotice(null);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    login.mutate(values, {
      onSuccess: (result) => {
        if (result === 'establishment-only') setNotice(ESTABLISHMENT_LOGIN_MESSAGE);
        else if (result === 'needs-role-selection') navigation.navigate('RoleSelection');
      },
      onError: signalFailure,
    });
  };

  const onGooglePress = async () => {
    setNotice(null);
    login.reset();
    setGoogleLoading(true);
    try {
      const result = await loginWithGoogle();
      if (result === 'needs-role-selection') navigation.navigate('RoleSelection');
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Erro ao autenticar com Google');
      signalFailure();
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <ThemedStatusBar />
      <StageLightsBackground />
      <AuthGlowBackground variant="subtle" />

      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.hero}>
            <SoundwaveMark
              energy={energy}
              busy={login.isPending || googleLoading}
              alarmSignal={alarmSignal}
            />
            <Animated.View entering={FadeInDown.delay(350).duration(600)} style={s.hero}>
              <Text style={s.eyebrow}>SOUNDMEET</Text>
              <Text style={s.title} accessibilityRole="header">
                A noite{'\n'}começa <Text style={s.titleAccent}>aqui.</Text>
              </Text>
              <Text style={s.subtitle}>Músicos, fãs e palcos na mesma frequência.</Text>
            </Animated.View>
          </View>

          <Animated.View entering={FadeInDown.delay(550).duration(600)}>
            <LoginForm
              loading={login.isPending}
              errorMessage={notice ?? login.errorMessage}
              shakeSignal={alarmSignal}
              onSubmit={onSubmit}
              onKeystroke={pulse}
              onForgotPassword={setForgotEmail}
            />
          </Animated.View>

          <Animated.View entering={FadeIn.delay(800).duration(500)} style={s.social}>
            <AuthDivider label="ou" />
            <GoogleAuthButton onPress={onGooglePress} loading={googleLoading} />
            <Pressable
              onPress={() => navigation.navigate('RoleSelection')}
              style={s.registerRow}
              accessibilityRole="button"
              accessibilityLabel="Criar conta"
            >
              <Text style={s.registerText}>
                Primeira vez aqui? <Text style={s.registerLink}>Criar conta</Text>
              </Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ForgotPasswordSheet
        // Remonta a cada abertura para começar com o e-mail que estava digitado.
        key={forgotEmail ?? 'closed'}
        visible={forgotEmail !== null}
        initialEmail={forgotEmail ?? ''}
        onClose={() => setForgotEmail(null)}
      />
    </SafeAreaView>
  );
}
