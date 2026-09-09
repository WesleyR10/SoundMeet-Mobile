import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft } from 'lucide-react-native';
import { spacing, typography } from '@/shared/design-system/tokens';
import { makeStyles } from '@/shared/design-system/makeStyles';
import { useTheme } from '@/shared/hooks/useTheme';
import { PrimaryButton } from '@/shared/components/PrimaryButton';
import { FormField } from '@/shared/components/FormField';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { AuthGlowBackground } from '../components/AuthGlowBackground';
import { RoleBadge } from '../components/RoleBadge';
import { completeCadastroSchema, type CompleteCadastroFormValues } from '@/features/auth/domain/auth.validation';
import { useSocialSignup, getSocialSignupErrorMessage } from '@/features/auth/application/useSocialSignup';
import { formatCpf, stripDigits } from '@/shared/utils/cpf';
import { formatPhoneBr } from '@/shared/utils/phone';
import type { AuthScreenProps } from '@/navigation/types';

type Props = AuthScreenProps<'CompleteMusicianSignup'>;

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
  form: {
    gap:       spacing.lg,
    marginTop: spacing.lg,
  },
  banner: {
    marginTop: spacing.lg,
  },
  submitBtn: {
    marginTop: spacing.xl,
  },
}));

export function CompleteMusicianSignupScreen({ navigation }: Props) {
  const s = useStyles();
  const { colors } = useTheme();
  const socialSignupMutation = useSocialSignup();

  const { control, handleSubmit } = useForm<CompleteCadastroFormValues>({
    resolver:      zodResolver(completeCadastroSchema),
    defaultValues: { cpf: '', phone: '' },
  });
  const [bannerError, setBannerError] = useState<string | null>(null);

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
      await socialSignupMutation.mutateAsync({
        role:  'musician',
        cpf:   stripDigits(values.cpf),
        phone: stripDigits(values.phone),
      });
      // Nenhuma navegação explícita necessária — auth.store.isAuthenticated vira true
      // dentro de applySocialSignupSession e o RootNavigator troca para o wizard
      // de perfil reativamente (músico sem stage_name ainda).
    } catch (err) {
      setBannerError(getSocialSignupErrorMessage(err));
    }
  });

  return (
    <SafeAreaView style={s.root}>
      <StatusBar style="light" />
      <AuthGlowBackground variant="subtle" />

      <Pressable
        onPress={() => navigation.goBack()}
        style={s.backBtn}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Voltar"
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
            <RoleBadge role="musician" />

            <Text style={s.title}>Só mais um passo</Text>
            <Text style={s.subtitle}>
              CPF e celular são obrigatórios para músicos — usamos para prevenir contas duplicadas.
            </Text>

            <View style={s.form}>
              <Controller
                control={control}
                name="cpf"
                render={({ field, fieldState }) => (
                  <FormField
                    label="CPF"
                    value={field.value}
                    onChangeText={(v) => field.onChange(formatCpf(v))}
                    onBlur={field.onBlur}
                    placeholder="000.000.000-00"
                    keyboardType="number-pad"
                    error={fieldState.error?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name="phone"
                render={({ field, fieldState }) => (
                  <FormField
                    label="Celular"
                    value={field.value}
                    onChangeText={(v) => field.onChange(formatPhoneBr(v))}
                    onBlur={field.onBlur}
                    placeholder="(00) 00000-0000"
                    keyboardType="number-pad"
                    autoComplete="tel"
                    error={fieldState.error?.message}
                  />
                )}
              />
            </View>

            {!!bannerError && <ErrorBanner message={bannerError} style={s.banner} />}

            <PrimaryButton
              label="Concluir cadastro"
              onPress={onSubmit}
              loading={socialSignupMutation.isPending}
              style={s.submitBtn}
            />
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
