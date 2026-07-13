import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { colors, spacing, typography } from '@/shared/design-system/tokens';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { GoogleAuthButton } from '@/shared/components/GoogleAuthButton';
import { AuthDivider } from '@/shared/components/AuthDivider';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { AuthGlowBackground } from '../components/AuthGlowBackground';
import { LoginFormFields } from '../components/LoginFormFields';
import { loginSchema, type LoginFormValues } from '@/features/auth/domain/auth.validation';
import { useLogin, getLoginErrorMessage } from '@/features/auth/application/useLogin';
import { loginWithGoogle } from '@/shared/services/auth/keycloak.service';
import type { AuthScreenProps } from '@/navigation/types';

type Props = AuthScreenProps<'Login'>;

export function LoginScreen({ navigation }: Props) {
  const loginMutation = useLogin();

  const { control, handleSubmit } = useForm<LoginFormValues>({
    resolver:      zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const [bannerError, setBannerError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const formOpacity = useSharedValue(0);
  const formY       = useSharedValue(16);

  useEffect(() => {
    formOpacity.value = withTiming(1, { duration: 400 });
    formY.value       = withTiming(0, { duration: 400 });
  }, [formOpacity, formY]);

  const formStyle = useAnimatedStyle(() => ({
    opacity:   formOpacity.value,
    transform: [{ translateY: formY.value }],
  }));

  const onSubmit = handleSubmit(async (values) => {
    setBannerError(null);
    try {
      await loginMutation.mutateAsync({ email: values.email.trim(), password: values.password });
      // Nenhuma navegação explícita necessária — auth.store.isAuthenticated vira true
      // dentro de applyTokenSession e o RootNavigator troca de stack reativamente.
    } catch (err) {
      setBannerError(getLoginErrorMessage(err));
    }
  });

  const onGooglePress = async () => {
    setBannerError(null);
    setGoogleLoading(true);
    try {
      const result = await loginWithGoogle();
      if (result === 'needs-role-selection') {
        navigation.navigate('RoleSelection');
      }
      // 'existing-user': RootNavigator reage sozinho. 'dismissed': usuário fechou o browser.
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : 'Erro ao autenticar com Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  const onForgotPassword = () => {
    Alert.alert('Em breve', 'A recuperação de senha ainda não está disponível.');
  };

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />
      <AuthGlowBackground variant="subtle" />

      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <Animated.View style={formStyle}>
            <Text style={s.brand}>SoundMeet</Text>
            <Text style={s.title}>Entrar</Text>
            <Text style={s.subtitle}>Que bom te ver de novo.</Text>

            <LoginFormFields control={control} />

            <Pressable
              onPress={onForgotPassword}
              hitSlop={8}
              style={s.forgotBtn}
              accessibilityRole="button"
              accessibilityLabel="Esqueci a senha"
            >
              <Text style={s.forgotText}>Esqueci a senha</Text>
            </Pressable>

            {!!bannerError && <ErrorBanner message={bannerError} />}

            <PrimaryButton
              label="Entrar"
              onPress={onSubmit}
              loading={loginMutation.isPending}
              style={s.submitBtn}
            />

            <View style={s.socialBlock}>
              <AuthDivider label="ou entre com" />
              <GoogleAuthButton onPress={onGooglePress} loading={googleLoading} />
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: colors.bg.primary,
  },
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop:        spacing.xxxl,
    paddingBottom:     spacing.xxxl,
    gap:               spacing.lg,
  },
  brand: {
    ...typography.title,
    color:         colors.brand.primary,
    letterSpacing: -0.3,
  },
  title: {
    ...typography.displayMd,
    fontFamily: 'SpaceGrotesk-Bold',
    color:      colors.text.primary,
    marginTop:  spacing.lg,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
  },
  forgotText: {
    ...typography.bodySm,
    fontFamily: 'Inter-SemiBold',
    color:      colors.brand.primary,
  },
  submitBtn: {
    marginTop: spacing.sm,
  },
  socialBlock: {
    gap:       spacing.lg,
    marginTop: spacing.sm,
  },
  registerRow: {
    alignItems: 'center',
    marginTop:  spacing.sm,
  },
  registerText: {
    ...typography.body,
    color: colors.text.secondary,
  },
  registerLink: {
    fontFamily: 'Inter-SemiBold',
    color:      colors.brand.primary,
  },
});
