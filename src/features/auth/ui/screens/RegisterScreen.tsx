import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react-native';
import { spacing, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { GoogleAuthButton } from '@/shared/components/GoogleAuthButton';
import { AuthDivider } from '@/shared/components/AuthDivider';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { AuthGlowBackground } from '../components/AuthGlowBackground';
import { RoleBadge } from '../components/RoleBadge';
import { RegisterFormFields } from '../components/RegisterFormFields';
import { registerSchema, type RegisterFormValues } from '@/features/auth/domain/auth.validation';
import { useRegister, getRegisterErrorMessage } from '@/features/auth/application/useRegister';
import { useSocialSignup, getSocialSignupErrorMessage } from '@/features/auth/application/useSocialSignup';
import { loginWithGoogle } from '@/shared/services/auth/keycloak.service';
import { stripDigits } from '@/shared/utils/cpf';
import type { AuthScreenProps } from '@/navigation/types';

type Props = AuthScreenProps<'Register'>;

const useStyles = makeStyles((colors) => ({
  root: {
    flex:            1,
    backgroundColor: colors.bg.primary,
  },
  flex: { flex: 1 },
  backBtn: {
    width:          48,
    height:         48,
    marginLeft:     spacing.lg,
    marginTop:      spacing.sm,
    alignItems:     'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: spacing.xl,
    paddingTop:        spacing.md,
    paddingBottom:     spacing.xxxl,
    gap:               spacing.lg,
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
  socialBlock: {
    gap:       spacing.lg,
    marginTop: spacing.xl,
  },
  banner: {
    marginTop: spacing.lg,
  },
  submitBtn: {
    marginTop: spacing.xl,
  },
}));

export function RegisterScreen({ navigation, route }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const { role } = route.params;
  const registerMutation = useRegister();
  const socialSignupMutation = useSocialSignup();

  const { control, handleSubmit } = useForm<RegisterFormValues>({
    resolver:      zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', role, cpf: '', phone: '' },
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
      await registerMutation.mutateAsync({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        role,
        ...(role === 'musician' && { cpf: stripDigits(values.cpf), phone: stripDigits(values.phone) }),
      });
      // Nenhuma navegação explícita necessária — auth.store.isAuthenticated vira true
      // dentro de applyRegisterSession e o RootNavigator troca para MusicianTabs reativamente,
      // igual ao fluxo de login bem-sucedido em LoginScreen.
    } catch (err) {
      setBannerError(getRegisterErrorMessage(err));
    }
  });

  const onGooglePress = async () => {
    setBannerError(null);
    setGoogleLoading(true);
    try {
      const result = await loginWithGoogle();
      if (result === 'needs-role-selection') {
        if (role === 'musician') {
          navigation.navigate('CompleteMusicianSignup');
          return;
        }
        try {
          await socialSignupMutation.mutateAsync({ role: 'audience' });
        } catch (err) {
          setBannerError(getSocialSignupErrorMessage(err));
        }
      }
      // 'existing-user': RootNavigator reage sozinho. 'dismissed': usuário fechou o browser.
    } catch (err) {
      setBannerError(err instanceof Error ? err.message : 'Erro ao autenticar com Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />
      <AuthGlowBackground variant="subtle" />

      <Pressable
        onPress={() => navigation.goBack()}
        style={s.backBtn}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Voltar para seleção de papel"
      >
        <ArrowLeft size={22} color={colors.text.primary} />
      </Pressable>

      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <Animated.View style={formStyle}>
            <RoleBadge role={role} />

            <Text style={s.title}>Criar conta</Text>
            <Text style={s.subtitle}>Leva menos de um minuto.</Text>

            <View style={s.socialBlock}>
              <GoogleAuthButton
                onPress={onGooglePress}
                loading={googleLoading || socialSignupMutation.isPending}
                disabled={registerMutation.isPending}
                label="Continuar com Google"
              />
              <AuthDivider />
            </View>

            <RegisterFormFields control={control} role={role} />

            {!!bannerError && <ErrorBanner message={bannerError} style={s.banner} />}

            <PrimaryButton
              label="Criar conta"
              onPress={onSubmit}
              loading={registerMutation.isPending}
              style={s.submitBtn}
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
