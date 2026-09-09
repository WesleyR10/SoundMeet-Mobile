import { useEffect, useState } from 'react';
import { Text, View, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { ShieldCheck } from 'lucide-react-native';
import { spacing, typography, radius } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { GoogleAuthButton } from '@/shared/components/GoogleAuthButton';
import { AuthDivider } from '@/shared/components/AuthDivider';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { AuthGlowBackground } from '../components/AuthGlowBackground';
import {
  login,
  loginWithGoogle,
  ESTABLISHMENT_LOGIN_MESSAGE,
} from '@/shared/services/auth/keycloak.service';
import type { AuthScreenProps } from '@/navigation/types';

type Props = AuthScreenProps<'Login'>;

/*
 * 🔴 AUTH-1 — esta tela NÃO coleta mais senha, e a ausência dos campos é a
 * correção, não uma simplificação de UI.
 *
 * Antes havia e-mail + senha num `useForm`, enviados a `POST /auth/login`
 * (Direct Access Grant). Hoje o botão abre o Keycloak em Chrome Custom Tab /
 * ASWebAuthenticationSession — dentro do app, sem sair para o navegador do
 * sistema — e o app só recebe o `code` no deep link. Exatamente o que o botão
 * do Google ao lado já fazia; a diferença é que agora vale para todo mundo.
 *
 * Não reintroduzir os campos: um `TextInput` de senha aqui só teria para onde
 * enviar o valor se o `POST /auth/login` voltasse a existir, e ele foi removido
 * do backend junto com o `LoginUseCase`.
 */
const useStyles = makeStyles((colors) => ({
  root: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  brand: {
    ...typography.title,
    color: colors.brand.primary,
    letterSpacing: -0.3,
  },
  title: {
    ...typography.displayMd,
    fontFamily: 'SpaceGrotesk-Bold',
    color: colors.text.primary,
    marginTop: spacing.lg,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },
  assuranceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.bg.surface,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  assuranceText: {
    ...typography.bodySm,
    color: colors.text.secondary,
    flex: 1,
  },
  submitBtn: {
    marginTop: spacing.sm,
  },
  socialBlock: {
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  registerRow: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  registerText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  registerLink: {
    fontFamily: 'Inter-SemiBold',
    color: colors.brand.primary,
  },
}));

export function LoginScreen({ navigation }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [loading, setLoading] = useState<'keycloak' | 'google' | null>(null);

  const formOpacity = useSharedValue(0);
  const formY = useSharedValue(16);

  useEffect(() => {
    formOpacity.value = withTiming(1, { duration: 400 });
    formY.value = withTiming(0, { duration: 400 });
  }, [formOpacity, formY]);

  const formStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formY.value }],
  }));

  // Os dois caminhos terminam igual: 'success' não navega (o RootNavigator
  // reage a auth.store), 'dismissed' é o usuário fechando o browser e não é
  // erro. Só o desfecho de papel difere entre entrar e entrar-com-Google.
  const onLoginPress = async () => {
    setBannerError(null);
    setLoading('keycloak');
    try {
      const result = await login();
      if (result === 'establishment-only') {
        setBannerError(ESTABLISHMENT_LOGIN_MESSAGE);
      } else if (result === 'needs-role-selection') {
        navigation.navigate('RoleSelection');
      }
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : 'Não foi possível entrar agora.');
    } finally {
      setLoading(null);
    }
  };

  const onGooglePress = async () => {
    setBannerError(null);
    setLoading('google');
    try {
      const result = await loginWithGoogle();
      if (result === 'needs-role-selection') {
        navigation.navigate('RoleSelection');
      }
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : 'Erro ao autenticar com Google');
    } finally {
      setLoading(null);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />
      <AuthGlowBackground variant="subtle" />

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <Animated.View style={formStyle}>
          <Text style={s.brand}>SoundMeet</Text>
          <Text style={s.title}>Entrar</Text>
          <Text style={s.subtitle}>Que bom te ver de novo.</Text>

          {/*
            O aviso existe porque a tela muda de contexto visual por um instante.
            Sem ele, quem vê o navegador abrir pensa que saiu do app — e é aí
            que alguém desconfia de um login legítimo.
          */}
          <View style={s.assuranceCard}>
            <ShieldCheck size={20} color={colors.brand.primary} />
            <Text style={s.assuranceText}>
              Sua senha é digitada direto no nosso servidor de identidade, sem passar pelo app.
            </Text>
          </View>

          {!!bannerError && <ErrorBanner message={bannerError} />}

          <PrimaryButton
            label="Entrar com e-mail e senha"
            onPress={onLoginPress}
            loading={loading === 'keycloak'}
            style={s.submitBtn}
          />

          <View style={s.socialBlock}>
            <AuthDivider label="ou entre com" />
            <GoogleAuthButton onPress={onGooglePress} loading={loading === 'google'} />
          </View>

          <Pressable
            onPress={() => navigation.navigate('RoleSelection')}
            style={s.registerRow}
            accessibilityRole="button"
            accessibilityLabel="Criar conta"
          >
            <Text style={s.registerText}>
              Não tem conta? <Text style={s.registerLink}>Criar conta</Text>
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
